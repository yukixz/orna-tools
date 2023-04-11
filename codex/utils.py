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


TEXTS = {
    "en": {
        "category": "Category",
        "causes": "Causes",
        "cures": "Cures",
        "drops": "Drops",
        "droppedBy": "Dropped by",
        "event": "Event",
        "events": "Events",
        "exotic": "Exotic",
        "family": "Family",
        "filters": "Filters",
        "gives": "Gives",
        "tags": "Tags",
        "tier": "Tier",
        "immunities": "Immunities",
        "materials": "Upgrade materials",
        "place": "Place",
        "rarity": "Rarity",
        "search": "Search",
        "skills": "Skills",
        "useableBy": "Useable by",
    },
    "zh-hans": {
        "category": "类别",
        "causes": "造成",
        "cures": "治疗",
        "drops": "掉落",
        "droppedBy": "掉落来源",
        "event": "活动",
        "events": "活动",
        "exotic": "限定",
        "family": "种类",
        "filters": "过滤",
        "gives": "赋予",
        "tags": "标签",
        "tier": "阶级",
        "immunities": "免疫",
        "materials": "升级素材",
        "place": "部位",
        "rarity": "稀有度",
        "search": "搜索",
        "skills": "技能",
        "useableBy": "适用于",
    }
}
