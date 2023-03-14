#!/usr/bin/env python3
# coding: utf-8
# pylint: disable=too-few-public-methods

from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Page(Base):
    __tablename__ = "pages"
    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    category = Column(String, nullable=False)
    path = Column(String, nullable=False)
    lang = Column(String, nullable=False)
    code = Column(Integer, nullable=True)
    html = Column(String, nullable=True)

    def __repr__(self):
        return (
            "Page("
            f"id={self.id}, date={self.date}, "
            f"path={self.path}, lang={self.lang}"
            ")")
