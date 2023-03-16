#!/usr/bin/env python3
# coding: utf-8

import json
import logging
import os.path
import re
import sys
from typing import Union

import sqlalchemy
from bs4 import BeautifulSoup, Tag
from orm import Base, GuideAPI, Page
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

logging.basicConfig(
    format="[%(asctime)s] %(levelname)s %(funcName)s:%(lineno)d %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

CATEGORIES = ("items", "monsters", "bosses", "followers", "raids", "spells")
TEXTS = {
    "en": {
        "Causes": "Causes",
        "Drops": "Drops",
        "DroppedBy": "Dropped by",
        "Gives": "Gives",
        "Tags": "Tags",
        "Immunities": "Immunities",
        "Materials": "Upgrade materials",
        "Skills": "Skills",
    },
    "zh-hans": {
        "Causes": "造成",
        "Drops": "掉落",
        "DroppedBy": "掉落来源",
        "Gives": "赋予",
        "Tags": "标签",
        "Immunities": "免疫",
        "Materials": "升级素材",
        "Skills": "技能",
    }
}


class Exporter:
    def __init__(self, db_engine) -> None:
        self.db_engine = db_engine
        self.guide = {}

    def prepare(self) -> None:
        with Session(self.db_engine) as session:
            guides = session.query(GuideAPI).all()
        for guide in guides:
            items = json.loads(guide.data)
            for item in items:
                path = item.get('codex', None)
                if path is None:
                    continue
                if path in self.guide:
                    logger.error("codex duplicated path=%s", path)
                self.guide[path] = item
        logger.info("Prepared orna.guide items=%d", len(self.guide))

    def export(self, lang) -> dict:
        logger.info("Exporting lang=%s", lang)
        data = {}
        data['text'] = TEXTS[lang]
        data['category'] = self.export_category(lang)
        data['codex'] = {}
        for category in CATEGORIES:
            data['codex'][category] = self.export_codex(category, lang)
        return data

    def export_category(self, lang) -> dict:
        logger.info("Exporting category")

        with Session(self.db_engine) as session:
            page = session.query(Page).filter(
                and_(Page.path == "/codex/", Page.lang == lang)
            ).one()
        soup = BeautifulSoup(page.html, "html.parser")
        nodes = soup.select("a.codex-link")
        catetories = {
            re.match(r'^/codex/(\w+)/$', node['href']).group(1): node.text.strip()
            for node in nodes
        }

        prefix = os.path.commonprefix(list(catetories.values()))
        catetories = {
            key: value.removeprefix(prefix).removesuffix("→").strip()
            for key, value in catetories.items()
        }
        return catetories

    def export_codex(self, category, lang) -> dict:
        logger.info("Exporting codex category=%s", category)
        ret = {}
        texts = TEXTS[lang]

        with Session(self.db_engine) as session:
            pages = session.query(Page).filter(
                and_(Page.path.like(f"/codex/{category}/%"), Page.lang == lang)
            ).all()
        logger.info("Exporting codex items length=%d", len(pages))
        for page in pages:
            key = self.key_by_url(page.path)
            if page.code != 200:
                logger.warning("Skipped lang=%s key=%s:%s code=%s",
                               lang, category, key, page.code)
                continue
            ret[key] = self.parse_item(page, texts)

        return ret

    def key_by_url(self, path: str) -> str:
        return re.match(r"/codex/\w+?/([\w-]+?)/", path).group(1)

    def extract_name(self, soup) -> Union[str, None]:
        return soup.select_one(".herotext").string

    def extract_image_url(self, soup) -> Union[str, None]:
        return soup.select_one(".codex-page-icon img")['src']

    def extract_description(self, soup) -> Union[str, None]:
        node = soup.select_one("pre.codex-page-description")
        if node is None:
            return None
        return node.string

    def extract_family_by(self, soup, text) -> Union[str, None]:
        pass

    def extract_tags(self, soup) -> Union[str, None]:
        return tuple(map(
            lambda e: e.string.replace('✓', '').strip(),
            soup.select(".codex-page-tag")))

    def find_h4(self, soup, text: str) -> Union[Tag, None]:
        text = text.lower() + ':'
        for node in soup.select(".codex-page h4"):
            if node.string.lower() == text:
                return node
        return None

    def extract_drops_by_h4(self, note_node: Union[Tag, None], extract: func) -> Union[list, None]:
        if note_node is None:
            return None
        ret = []
        for node in note_node.next_siblings:
            if node.name is None:
                continue
            if node.name != "div":
                break
            ret.append(extract(node))
        return ret

    def extract_status(self, node: Tag) -> tuple[str, int]:
        text = node.select_one('span').string
        matched = re.match(r'^(.+) \((\d+)%\)$', text)
        if matched is not None:
            groups = matched.groups()
            return (groups[0], int(groups[1]))
        matched = re.match(r'^(.+)$', text)
        groups = matched.groups()
        return (groups[0], None)

    def extract_key_by_href(self, node: Tag) -> str:
        path = node.select_one('a')['href']
        return self.key_by_url(path)

    def parse_item(self, page: Page, texts: dict) -> dict:
        soup = BeautifulSoup(page.html, "html.parser")
        guide = self.guide.get(page.path, {})
        ret = {
            "name": self.extract_name(soup),
            "path": page.path,
            "ornaguide_id": guide.get('id'),
            "image_url": self.extract_image_url(soup),
            "description": self.extract_description(soup),
            "tags": self.extract_tags(soup),
            "causes": self.extract_drops_by_h4(
                self.find_h4(soup, texts["Causes"]), self.extract_status),
            "gives": self.extract_drops_by_h4(
                self.find_h4(soup, texts["Gives"]), self.extract_status),
            "immunities": self.extract_drops_by_h4(
                self.find_h4(soup, texts["Immunities"]), self.extract_status),
            "spells": self.extract_drops_by_h4(
                self.find_h4(soup, texts["Skills"]), self.extract_key_by_href),
            "drops": self.extract_drops_by_h4(
                self.find_h4(soup, texts["Drops"]), self.extract_key_by_href),
            "dropped_by": self.extract_drops_by_h4(
                self.find_h4(soup, texts["DroppedBy"]), self.extract_key_by_href),
            "materials": self.extract_drops_by_h4(
                self.find_h4(soup, texts["Materials"]), self.extract_key_by_href),
        }
        for key, value in tuple(ret.items()):
            if value is None:
                del ret[key]
            if isinstance(value, str) and len(value) == 0:
                del ret[key]
            if isinstance(value, list) and len(value) == 0:
                del ret[key]
            if isinstance(value, tuple) and len(value) == 0:
                del ret[key]
        return ret


def main():
    db_engine = sqlalchemy.create_engine("sqlite:///db.sqlite3")
    Base.metadata.create_all(db_engine)

    exporter = Exporter(db_engine)
    exporter.prepare()
    for lang in ["en", "zh-hans"]:
        data = exporter.export(lang)
        with open(f"./exports/{lang}.json", 'w', encoding='utf-8') as f:
            f.write(json.dumps(data, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
