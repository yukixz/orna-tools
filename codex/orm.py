#!/usr/bin/env python3
# coding: utf-8
# pylint: disable=too-few-public-methods

from sqlalchemy import Column, DateTime, Integer, String, func
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Page(Base):
    __tablename__ = "pages"
    id = Column(Integer, primary_key=True)
    path = Column(String, nullable=False)
    lang = Column(String, nullable=False)
    code = Column(Integer, nullable=True)
    html = Column(String, nullable=True)
    # pylint: disable=not-callable
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"Page(id={self.id}, path={self.path}, lang={self.lang})"


class GuideAPI(Base):
    __tablename__ = "guide_api"
    id = Column(Integer, primary_key=True)
    action = Column(String, nullable=False)
    tier = Column(Integer, nullable=False)
    code = Column(Integer, nullable=True)
    data = Column(String, nullable=True)
    # pylint: disable=not-callable
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"Page(id={self.id}, action={self.action})"
