#!/usr/bin/env python3
# coding: utf-8

import logging
import re
import sys

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

    def parse_page(self, path) -> None:
        logger.info("Parse page with path=%s", path)
        resp = self.http.get_playorna_com(path, self.lang)
        if resp.status_code == 404:
            logger.warning("Page is missing. Remove path=%s", path)
            return
        if resp.status_code != 200:
            logger.warning("Page return unknown code=%d. Keep path=%s",
                           resp.status_code, path)
            self.known.add(path)
            return

        soup = BeautifulSoup(resp.text, "lxml")
        for item in soup.find_all("a", href=re.compile(r'^/codex/[^/]+/[^/]+/')):
            path = item['href']
            if path in self.known:
                continue
            logger.debug("Found path %s", path)
            self.known.add(path)
            self.queue.append(path)

    def run(self) -> None:
        logger.info("Run with lang=%s", self.lang)

        self.bootstrap()
        self.load()
        while len(self.queue) >= 1:
            self.parse_page(self.queue.pop(0))
        self.save()

        logger.info("Done with lang=%s", self.lang)


if __name__ == '__main__':
    app = Indexer(
        path="./data/playorna.com.txt",
        categories=("items", "monsters", "bosses",
                    "followers", "raids", "spells"),
        lang="en",
    )
    app.run()
