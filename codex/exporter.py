#!/usr/bin/env python3
# coding: utf-8

import logging
import os.path
import re
import sys

from bs4 import BeautifulSoup, Tag
from utils import TEXTS, HttpSession

logging.basicConfig(
    format="[%(asctime)s] %(levelname)s %(funcName)s:%(lineno)d %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def normalize(string: str):
    string = string \
        .replace('✓', '') \
        .replace('★', '') \
        .strip()
    try:
        return int(string)
    except ValueError:
        return string


class Exporter:
    def __init__(self, index_path, lang):
        self.index_path = index_path
        self.lang = lang
        self.texts = TEXTS[lang]
        self.http = HttpSession()
        self.guide = {}
        self.meta_rules = None

    def prepare(self):
        for category in ("item", "skill", "pet", "monster"):
            items = []
            for tier in range(1, 10 + 1):
                items.extend(self.fetch_guide(category, tier))
            for item in items:
                path = item.get('codex', None)
                if path is None:
                    continue
                if path in self.guide:
                    logger.error("codex duplicated path=%s", path)
                self.guide[path] = item
                item['category'] = category
        logger.info("Prepared orna.guide items=%d", len(self.guide))

    def fetch_guide(self, action, tier):
        logger.info("fetch orna.guide action=%s tier=%s", action, tier)
        resp = self.http.post(
            url=f"https://orna.guide/api/v1/{action}",
            json={"tier": tier},
        )
        if resp.status_code == 200:
            return resp.json()
        logger.error("fetched error action=%s tier=%s http_status_code=%d",
                     action, tier, resp.status_code)
        return resp.raise_for_status()

    def export(self):
        logger.info("Exporting lang=%s", self.lang)
        data = {}
        data['text'] = self.texts
        data['category'] = self.export_category()
        data['codex'] = self.export_codexes()
        self.add_causes_by_spells(data['codex'])
        self.add_material_for(data['codex'])
        data['options'] = self.export_options(data['codex'])
        return data

    def export_category(self):
        logger.info("Exporting category")

        resp = self.http.get_playorna_com("/codex/", self.lang)
        soup = BeautifulSoup(resp.text, "lxml")
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

    def export_codexes(self):
        logger.info("Exporting codexes")
        paths = set()
        with open(self.index_path, 'r', encoding='utf-8') as file:
            for path in file.readlines():
                paths.add(path.strip())

        logger.info("Codex index items=%d", len(paths))
        codexes = {}
        for path in paths:
            resp = self.http.get_playorna_com(path, self.lang)
            if resp.status_code != 200:
                logger.warning("Skipped codex path=%s code=%s",
                               path, resp.status_code)
                continue

            id_ = self.id_from_url(path)
            try:
                codexes[id_] = self.parse_item(path, resp.text)
            except:
                logger.error("id=%s", id_)
                raise

        return codexes

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
                ['events', 'events'],
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

    def category_from_url(self, path: str):
        return re.match(r"/codex/(\w+?)/[\w-]+?/", path).group(1)

    def parse_item(self, path: str, html: str):
        soup = BeautifulSoup(html, "lxml")
        codex = {
            "name": self.extract_name(soup),
            "path": path,
            "category": self.category_from_url(path),
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
        guide = self.guide.get(path)
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
        for _, item in codexes.items():
            if 'spells' not in item:
                continue
            causes = {}
            for target_id in item['spells']:
                if target_id not in codexes:
                    logger.warning("Unknown spell: %s", target_id)
                    continue
                target = codexes[target_id]
                if 'causes' not in target:
                    continue
                for [status, probability] in target['causes']:
                    current = causes.get(status, {
                        'probability': 0,
                        'by': [],
                    })
                    current['by'].append(f"{target['name']} ({probability}%)")
                    if probability > current['probability']:
                        current['probability'] = probability
                    causes[status] = current
            if len(causes) >= 1:
                item['causes_by_spells'] = causes

    def extract_name(self, soup: BeautifulSoup):
        return str(soup.select_one(".herotext").string)

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
            return {'tags': [normalize(e.string) for e in subs]}
        # stats
        subs = node.select('.codex-stat')
        if len(subs) >= 1:
            return {'stats': [normalize(e.string) for e in subs]}
        # meta
        if self.meta_rules is None:
            self.meta_rules = [
                (key, re.compile(f"^({self.texts[key]})$"), lambda s: True)
                for key in ['exotic']
            ] + [
                (key, re.compile(f"^{self.texts[key]}: *(.+)$"), None)
                for key in ["family", "place", "rarity", "tier", "useableBy"]
            ] + [
                ('events', re.compile(f"^{self.texts['event']}: *(.+)$"),
                 lambda string: sorted([normalize(s) for s in string.split('/')])),
            ]
        if 'codex-page-description' in classes or 'codex-page-meta' in classes:
            string = ''.join(node.stripped_strings)
            # meta
            for key, pattern, parse in self.meta_rules:
                matched = re.match(pattern, string)
                if matched is None:
                    continue
                if parse is None:
                    parse = normalize
                return {key: parse(matched.group(1))}
            # description
            if 'codex-page-description' in classes:
                return {'description': string}
            logging.warning("Unknown meta node: %s", node)
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
