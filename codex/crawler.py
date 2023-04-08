#!/usr/bin/env python3
# coding: utf-8

import logging
import sys
from datetime import datetime, timedelta

import requests_cache
from bs4 import BeautifulSoup
from orm import GuideAPI, Page
from sqlalchemy import and_
from sqlalchemy.orm import Session

logging.basicConfig(
    format="[%(asctime)s] %(levelname)s %(funcName)s:%(lineno)d %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

CATEGORIES = ("items", "monsters", "bosses", "followers", "raids", "spells")
CATEGORIES_GUIDE = ("item", "skill", "pet", "monster")


class Crawler:
    def __init__(self, db_engine) -> None:
        self.db_engine = db_engine
        self.session = requests_cache.CachedSession(
            "http_cache",
            backend='sqlite',
            use_temp=True,
            expire_after=timedelta(hours=1),
            allowable_methods=['GET', 'POST'],
            allowable_codes=[200, 404],
            match_headers=True,
        )
        self.fetched_count = 0
        self.fetched_last_reported = datetime.now()

    def fetch_html(self, path, lang) -> requests_cache.Response:
        logger.debug("path=%s lang=%s", path, lang)
        resp = self.session.get(
            url=f"https://playorna.com{path}",
            cookies={
                "banneraccept": "1",
                "ornalang": lang,
            },
            headers={
                "accept": "text/html,application/xhtml+xml,application/xml",
                "accept-encoding": "gzip, deflate",
                "referer": "https://playorna.com/codex/",
                "user-agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/108.0.0.0 Safari/537.36"),
            })
        self.fetched_count += 1
        if datetime.now() >= self.fetched_last_reported + timedelta(minutes=1):
            logger.info("fetched %d urls from last reported",
                        self.fetched_count)
            self.fetched_count = 0
            self.fetched_last_reported = datetime.now()
        return resp

    def fetch_page(self, path, lang) -> None:
        resp = self.fetch_html(path, lang)
        if resp.status_code not in (200, 404):
            logger.error("path=%s http_status_code=%d",
                         path, resp.status_code)
            return

        with Session(self.db_engine) as session:
            page = session.query(Page).filter(
                and_(Page.path == path, Page.lang == lang)
            ).one_or_none()
            if page is None:
                page = Page(path=path, lang=lang)
            page.code = resp.status_code
            page.html = resp.text
            session.add(page)
            session.commit()

    def crawl_and_parse_category_index(self, category, lang):
        index = 1
        while True:
            resp = self.fetch_html(f"/codex/{category}/?p={index}", lang)
            if resp.status_code == 404:
                break
            soup = BeautifulSoup(resp.text, "lxml")
            for item in soup.select("a.codex-entries-entry"):
                yield item['href']
            index += 1

    def crawl(self, lang="en") -> None:
        logger.info("Crawling... lang=%s", lang)
        waitlist = set()
        # codex homepage
        waitlist.add("/codex/")
        # get entries from index page
        for category in CATEGORIES:
            for path in self.crawl_and_parse_category_index(category, lang):
                waitlist.add(path)
        # get entries from saved codex
        with Session(self.db_engine) as session:
            pages = session.query(Page.path).all()
            for page in pages:
                waitlist.add(page.path)
        # update entries in waitlist
        logger.info("waitlist length=%d", len(waitlist))
        for path in sorted(waitlist):
            self.fetch_page(path, lang)
        logger.info("Crawl done. lang=%s", lang)

    def fetch_guide(self, action, tier):
        logger.info("action=%s tier=%s", action, tier)
        resp = self.session.post(
            url=f"https://orna.guide/api/v1/{action}",
            json={"tier": tier},
        )
        if resp.status_code != 200:
            logger.error("action=%s tier=%s http_status_code=%d",
                         action, tier, resp.status_code)
            return

        with Session(self.db_engine) as session:
            page = session.query(GuideAPI).filter(
                and_(GuideAPI.action == action, GuideAPI.tier == tier)
            ).one_or_none()
            if page is None:
                page = GuideAPI(action=action, tier=tier,
                                code=resp.status_code, data=resp.text)
            session.add(page)
            session.commit()

    def crawl_guide(self) -> None:
        logger.info("Crawling...")
        for category in CATEGORIES_GUIDE:
            for tier in range(1, 10 + 1):
                self.fetch_guide(category, tier)
        logger.info("Crawl done.")
