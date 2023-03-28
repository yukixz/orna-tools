#!/usr/bin/env python3
# coding: utf-8

import json
import logging
import os.path
import re
import sys

from bs4 import BeautifulSoup, Tag
from orm import GuideAPI, Page
from sqlalchemy import and_
from sqlalchemy.orm import Session

logging.basicConfig(
    format="[%(asctime)s] %(levelname)s %(funcName)s:%(lineno)d %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

TEXTS = {
    "en": {
        "category": "Category",
        "causes": "Causes",
        "cures": "Cures",
        "drops": "Drops",
        "droppedBy": "Dropped by",
        "event": "Event",
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


class Exporter:
    def __init__(self, db_engine, lang):
        self.db_engine = db_engine
        self.lang = lang
        self.texts = TEXTS[lang]
        self.guide = {}

    def prepare(self):
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
                item['category'] = guide.action
                self.guide[path] = item
        logger.info("Prepared orna.guide items=%d", len(self.guide))

    def export(self):
        logger.info("Exporting lang=%s", self.lang)
        data = {}
        data['text'] = self.texts
        data['category'] = self.export_category()
        data['codex'] = {}
        for category in data['category'].keys():
            data['codex'].update(self.export_codex(category))
        self.add_causes_by_spells(data['codex'])
        self.add_material_for(data['codex'])
        data['options'] = self.export_options(data['codex'])
        return data

    def export_category(self):
        logger.info("Exporting category")

        with Session(self.db_engine) as session:
            page = session.query(Page).filter(
                and_(Page.path == "/codex/", Page.lang == self.lang)
            ).one()
        soup = BeautifulSoup(page.html, "html.parser")
        nodes = soup.select("a.codex-link")
        catetories = {
            re.match(r'^/codex/(\w+)/$', node['href']).group(1): node.text.strip().title()
            for node in nodes
        }

        prefix = os.path.commonprefix(list(catetories.values()))
        catetories = {
            key: value.removeprefix(prefix).removesuffix("→").strip()
            for key, value in catetories.items()
        }
        return catetories

    def export_codex(self, category):
        logger.info("Exporting codex category=%s", category)
        ret = {}

        with Session(self.db_engine) as session:
            pages = session.query(Page).filter(
                and_(Page.path.like(
                    f"/codex/{category}/%"), Page.lang == self.lang)
            ).all()
        logger.info("Exporting codex items=%d", len(pages))
        for page in pages:
            id_ = self.id_from_url(page.path)
            if page.code != 200:
                logger.info("Skipped id=%s code=%s", id_, page.code)
                continue
            try:
                ret[id_] = self.parse_item(page, category)
            except:
                logger.error("id=%s", id_)
                raise

        return ret

    def export_options(self, codexes):
        logger.info("Exporting options")
        options = {
            "events": set(),
            "families": set(),
            "places": set(),
            "rarities": set(),
            "statuses": set(),
            "tags": set(),
            "tiers": set(),
            "useables": set(),
        }
        for _, item in codexes.items():
            # item.x is value directly
            for to, fr in [
                ['events', 'event'],
                ['families', 'family'],
                ['places', 'place'],
                ['rarities', 'rarity'],
                ['tiers', 'tier'],
                ['useables', 'useableBy'],
            ]:
                if fr not in item:
                    continue
                value = item[fr]
                options[to].add(value)
            # item.x is [value, value, ...]
            for to, fr in [
                ['tags', 'tags'],
            ]:
                if fr not in item:
                    continue
                for value in item[fr]:
                    options[to].add(value)
            # item.x is [[value, ...unused], ...]
            for to, fr in [
                ['statuses', 'causes'],
                ['statuses', 'cures'],
                ['statuses', 'gives'],
                ['statuses', 'immunities'],
            ]:
                if fr not in item:
                    continue
                for values in item[fr]:
                    value = values[0]
                    options[to].add(value)
        return {
            key: sorted(values)
            for key, values in options.items()
        }

    def id_from_url(self, path: str):
        return re.match(r"/codex/(\w+?/[\w-]+?)/", path).group(1)

    def parse_item(self, page: Page, category: str):
        soup = BeautifulSoup(page.html, "html.parser")
        codex = {
            "name": self.extract_name(soup),
            "path": page.path,
            "category": category,
        }

        # codex page
        extractors = iter([
            (self.extract_info,),
            (self.extract_list,
             "causes", self.texts["causes"], self.parse_status),
            (self.extract_list,
             "cures", self.texts["cures"], self.parse_status),
            (self.extract_list,
             "gives", self.texts["gives"], self.parse_status),
            (self.extract_list,
             "immunities", self.texts["immunities"], self.parse_status),
            (self.extract_list,
             "dropped_by", self.texts["droppedBy"], self.parse_href),
            (self.extract_list,
             "materials", self.texts["materials"], self.parse_href),
            (self.extract_list,
             "spells", self.texts["skills"], self.parse_href),
            (self.extract_list,
             "drops", self.texts["drops"], self.parse_href),
        ])
        nodes = list(filter(
            lambda node: isinstance(node, Tag) and node.name != 'hr',
            soup.select_one(".codex-page").children))

        try:
            extract, *extract_args = next(extractors)
            while len(nodes) >= 1:
                ret = extract(nodes, *extract_args)
                if ret is not None:
                    codex.update(ret)
                else:
                    extract, *extract_args = next(extractors)
        except StopIteration:
            pass

        # orna.guide
        guide = self.guide.get(page.path)
        if guide is not None:
            codex.update({
                "ornaguide_id": guide['id'],
                "ornaguide_category": guide['category'],
            })

        # cleanup
        for key, value in tuple(codex.items()):
            if value is None:
                del codex[key]
            if isinstance(value, (str, list, tuple)) and len(value) == 0:
                del codex[key]
        return codex

    def add_material_for(self, codexes):
        logger.info("Exporting codex: Adding material for")
        for id_, item in codexes.items():
            if 'materials' not in item:
                continue
            for target_id in item['materials']:
                target = codexes[target_id]
                if 'material_for' not in target:
                    target['material_for'] = []
                target['material_for'].append(id_)

    def add_causes_by_spells(self, codexes):
        logger.info("Exporting codex: Adding causes by spells")
        for id_, item in codexes.items():
            if 'spells' not in item:
                continue
            causes = {}
            for target_id in item['spells']:
                target = codexes[target_id]
                if 'causes' not in target:
                    continue
                for [status, probability] in target['causes']:
                    current = causes.get(status, {
                        'probability': 0,
                        'by': [],
                    })
                    current['by'].append(f"{status} ({probability}%)")
                    if probability > current['probability']:
                        current['probability'] = probability
                    causes[status] = current
            if len(causes) >= 1:
                item['causes_by_spells'] = causes

    def normalize(self, string: str):
        string = string \
            .replace('✓', '') \
            .replace('★', '') \
            .strip()
        try:
            return int(string)
        except ValueError:
            return string

    def extract_name(self, soup: BeautifulSoup):
        return soup.select_one(".herotext").string

    def extract_info(self, nodes: list[Tag]):
        node = nodes.pop(0)
        classes = node.get('class', tuple())
        # image
        sub = node.select_one('.codex-page-icon img')
        if sub is not None:
            return {'image_url': sub['src']}
        # tags
        subs = node.select('.codex-page-tag')
        if len(subs) >= 1:
            return {'tags': [self.normalize(e.string) for e in subs]}
        # stats
        subs = node.select('.codex-stat')
        if len(subs) >= 1:
            return {'stats': [self.normalize(e.string) for e in subs]}
        # meta
        if 'codex-page-description' in classes:
            string = ''.join(node.stripped_strings)
            for key in ("event", "family", "rarity", "tier"):
                prefix = f"{self.texts[key]}:"
                if string.startswith(prefix):
                    return {key: self.normalize(string.removeprefix(prefix))}
            return {'description': string}
        if 'codex-page-meta' in classes:
            string = ''.join(node.stripped_strings)
            for key in ("tier", "rarity", "useableBy", "place"):
                prefix = f"{self.texts[key]}:"
                if string.startswith(prefix):
                    return {key: self.normalize(string.removeprefix(prefix))}
            return {}
        # bypass until h4
        if node.name != 'h4':
            return {}
        # goto next extractor
        nodes.insert(0, node)
        return None

    def extract_list(self, nodes: list[Tag], key: str, label: str, extract):
        first = nodes[0]
        if not (first.name == 'h4' and
                first.string.lower().startswith(label.lower())):
            return None
        nodes.pop(0)

        valid_nodes = []
        while len(nodes) >= 1 and nodes[0].name == 'div':
            valid_nodes.append(nodes.pop(0))
        return {key: [extract(node) for node in valid_nodes]}

    def parse_status(self, node: Tag):
        text = node.select_one('span').string
        matched = re.match(r'^(.+) \((\d+)%\)$', text)
        if matched is not None:
            groups = matched.groups()
            return (groups[0], int(groups[1]))
        matched = re.match(r'^(.+)$', text)
        groups = matched.groups()
        return (groups[0], None)

    def parse_href(self, node: Tag):
        path = node.select_one('a')['href']
        return self.id_from_url(path)
