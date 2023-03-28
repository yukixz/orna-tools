#!/usr/bin/env python3
# coding: utf-8

import argparse
import json
import os

import sqlalchemy
from orm import migrate


def open_db(path, is_init=False):
    url = f"sqlite:///{path}"
    if is_init:
        engine = sqlalchemy.create_engine(url)
        migrate(engine=engine)
        return engine

    if not os.path.isfile(path):
        raise FileNotFoundError(
            f"'{path}' is not found or not a file.")
    engine = sqlalchemy.create_engine(url)
    return engine


def crawl(engine, langs):
    from crawler import Crawler
    crawler = Crawler(engine)
    for lang in langs:
        crawler.crawl(lang)
    crawler.crawl_guide()


def export(engine, langs, directory):
    from exporter import Exporter
    if not os.path.isdir(directory):
        raise FileNotFoundError(
            f"'{directory}' is not found or not a directory.")

    for lang in langs:
        exporter = Exporter(engine, lang)
        exporter.prepare()
        data = exporter.export()
        with open(
            os.path.join(directory, f"{lang}.json"), 'w', encoding='utf-8',
        ) as file:
            file.write(json.dumps(data, indent=2, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--db', metavar='FILE', required=True)
    parser.add_argument('--lang', action='append')
    parser.add_argument('--init', action='store_true')
    parser.add_argument('--crawl', action='store_true')
    parser.add_argument('--export', metavar='DIR')
    args = parser.parse_args()

    if args.init:
        open_db(args.db, is_init=True)
        return

    engine = open_db(args.db)
    if args.crawl:
        crawl(engine, args.lang)
    if args.export:
        export(engine, args.lang, args.export)


if __name__ == '__main__':
    ''' python3 ./codex/main.py \
        --db ./codex/db.sqlite3 \
        --lang en --lang zh-hans \
        --export src/data/
    '''
    main()
