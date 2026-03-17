from sqlalchemy import Column, DateTime
from sqlalchemy import event
from sqlalchemy.orm import Mapper
from datetime import datetime, timezone


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@event.listens_for(Mapper, "before_insert")
def before_insert(mapper, connection, target):
    if isinstance(target, TimestampMixin):
        target.created_at = _utcnow()
        target.updated_at = _utcnow()


@event.listens_for(Mapper, "before_update")
def before_update(mapper, connection, target):
    if isinstance(target, TimestampMixin):
        target.updated_at = _utcnow()
