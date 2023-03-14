#!/usr/bin/env python3
# coding: utf-8

import logging
from datetime import datetime, timedelta

import requests_cache
import sqlalchemy
from bs4 import BeautifulSoup
from sqlalchemy import and_
from sqlalchemy.orm import Session

from orm import Base, Page


logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(funcName)s:%(lineno)d %(message)s",
)


class Crawler:
    def __init__(self, db_engine) -> None:
        self.db_engine = db_engine
        self.session = requests_cache.CachedSession(
            "http_cache",
            backend='sqlite',
            use_temp=True,
            expire_after=timedelta(hours=1),
            allowable_methods=['GET'],
            allowable_codes=[200, 404],
            match_headers=True,
        )

    def fetch_html(self, path, lang) -> requests_cache.Response:
        logging.info("path=%s lang=%s", path, lang)
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
        return resp

    def fetch_item(self, category, path, lang) -> None:
        resp = self.fetch_html(path, lang)
        if resp.status_code not in (200, 404):
            logging.info("path=%s ERROR http_status_code=%d",
                         path, resp.status_code)
            return
        new_page = Page(
            date=datetime.utcnow().date(),
            category=category,
            path=path,
            lang=lang,
            code=resp.status_code,
            html=resp.text)

        # check is same as last fetch
        with Session(self.db_engine) as session:
            page = session.query(Page).filter(
                and_(Page.path == path, Page.lang == lang)
            ).order_by(Page.date.desc()).first()
            if (page is not None and
                    page.code == new_page.code and page.html == new_page.html):
                logging.info("path=%s SAME", path)
                return
            session.add(new_page)
            session.commit()
            logging.info("path=%s COMMIT", path)

    def crawl(self, category, lang="en") -> None:
        waitlist = set()
        # get entries from index page
        index = 1
        while True:
            resp = self.fetch_html(f"/codex/{category}/?p={index}", lang)
            if resp.status_code == 404:
                break
            soup = BeautifulSoup(resp.text, "html.parser")
            for item in soup.select("a.codex-entries-entry"):
                waitlist.add(item['href'])
            index += 1
        # get entries from saved codex
        with Session(self.db_engine) as session:
            pages = session.query(Page.path).filter(
                Page.category == category).all()
            for page in pages:
                waitlist.add(page.path)
        # update entries in waitlist
        for path in waitlist:
            self.fetch_item(category, path, lang)


def main():
    db_engine = sqlalchemy.create_engine("sqlite:///db.sqlite3")
    Base.metadata.create_all(db_engine)

    crawler = Crawler(db_engine)
    for lang in ("en", "zh-hans"):
        for category in ("items", "monsters", "bosses", "followers", "raids", "spells"):
            crawler.crawl(category, lang)


if __name__ == '__main__':
    main()
