#!/usr/bin/env python3
# coding: utf-8
# pylint: disable=abstract-method

from datetime import timedelta

import requests_cache


class HttpSession(requests_cache.CachedSession):
    def __init__(self) -> None:
        super().__init__(
            "/tmp/http_cache.sqlite",
            backend='sqlite',
            expire_after=timedelta(hours=22),
            allowable_methods=['GET', 'POST'],
            allowable_codes=[200, 404],
            match_headers=True,
        )

    def get_playorna_com(self, path, lang) -> requests_cache.Response:
        return self.get(
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
