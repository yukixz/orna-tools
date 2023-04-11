#!/usr/bin/env python3
# coding: utf-8
# pylint: disable=import-outside-toplevel

import argparse
import json
import os

INDEX_FILE = "./data/playorna.com.txt"


def update_index():
    from indexer import Indexer
    indexer = Indexer(
        path=INDEX_FILE,
        categories=("items", "monsters", "bosses",
                    "followers", "raids", "spells"),
        lang="en",
    )
    indexer.run()


def export(directory, langs):
    from exporter import Exporter
    if not os.path.isdir(directory):
        raise FileNotFoundError(
            f"'{directory}' is not found or not a directory.")

    for lang in langs:
        exporter = Exporter(INDEX_FILE, lang)
        exporter.prepare()
        data = exporter.export()
        with open(
            os.path.join(directory, f"{lang}.json"), 'w', encoding='utf-8',
        ) as file:
            file.write(json.dumps(data, indent=2, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--index', action='store_true')
    parser.add_argument('--export', metavar='DIR')
    parser.add_argument('--langs', metavar='LANG[,LANG,...]')
    args = parser.parse_args()

    if args.index:
        update_index()
    if args.export:
        langs = args.langs.split(',')
        export(args.export, langs)


if __name__ == '__main__':
    main()
