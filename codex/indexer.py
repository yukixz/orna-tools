#!/usr/bin/env python3
# coding: utf-8

import logging
import re
import sys

import requests
from bs4 import BeautifulSoup
from utils import HttpSession

logging.basicConfig(
    format="[%(asctime)s] %(levelname)s %(funcName)s:%(lineno)d %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class Indexer:
    def __init__(self, path, categories, lang="en") -> None:
        logger.info("Initiate with path=%s lang=%s", path, lang)
        self.path = path
        self.categories = categories
        self.lang = lang
        self.http = HttpSession()
        self.known = set()
        self.queue = []
        self.is_codex = re.compile(r'^/codex/[^/]+/[^/]+/')

    def bootstrap(self) -> None:
        logger.info("Bootstrap from category pages")
        for category in self.categories:
            # limit max page number in case of infinite loop
            for page_no in range(1, 10000):
                path = f"/codex/{category}/?p={page_no}"
                resp = self.http.get_playorna_com(path, self.lang)
                if resp.status_code == 404:
                    break
                self.queue.append(path)
        logger.info("Bootstraped. Queue length %d", len(self.queue))

    def load(self) -> None:
        logger.info("Load saved into queue")
        with open(self.path, 'r', encoding='utf-8') as fd:
            for path in fd.readlines():
                self.queue.append(path.strip())
        logger.info("Loaded. Queue length %d", len(self.queue))

    def save(self) -> None:
        logger.info("Save known paths")
        with open(self.path, 'w', encoding='utf-8') as fd:
            fd.write('\n'.join(sorted(self.known)))

    def check_page(self, path: str, resp: requests.Response) -> None:
        ''' Check whether a path is valid codex path '''
        # Keep all pages except 404 in known paths
        if resp.status_code == 404:
            logger.warning("Page path=%s is missing.", path)
            return
        if self.is_codex.match(path):
            self.known.add(path)

    def parse_page(self, path: str, resp: requests.Response) -> None:
        ''' Add codex links from the page to queue '''
        # Parse pages with status code 200 only
        if resp.status_code != 200:
            logger.warning("Page path=%s return unknown status code=%d.",
                           path, resp.status_code)
            return
        soup = BeautifulSoup(resp.text, "lxml")
        for item in soup.find_all("a", href=self.is_codex):
            path = item['href']
            logger.debug("Found path=%s", path)
            self.queue.append(path)

    def consume_queue(self) -> None:
        while len(self.queue) >= 1:
            path = self.queue.pop(0)
            if path in self.known:
                continue
            logger.info("Process path=%s", path)
            response = self.http.get_playorna_com(path, self.lang)
            self.check_page(path, response)
            self.parse_page(path, response)

    def run(self) -> None:
        logger.info("Run with lang=%s", self.lang)

        self.load()
        self.bootstrap()
        self.consume_queue()
        self.save()

        logger.info("Done with lang=%s", self.lang)
