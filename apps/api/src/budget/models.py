import datetime
from sqlalchemy import (
    Column,
    ForeignKey,
    Float,
    Integer,
    String,
    DateTime,
    Boolean,
    event,
    func,
)
from sqlalchemy.orm import relationship
from src.core.utils import generate_uuid
from src.core.database import Base
from src.core.mixins import TimestampMixin


class BudgetModel(TimestampMixin, Base):
    __tablename__ = "budgets"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    description = Column(String, nullable=True)
    alert_warning_pct = Column(Integer, nullable=False, default=80)
    alert_danger_pct = Column(Integer, nullable=False, default=100)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("UserModel", back_populates="budgets")
    items = relationship("BudgetItemModel", back_populates="budget")


class BudgetItemModel(TimestampMixin, Base):
    __tablename__ = "budget_items"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    budget_id = Column(String, ForeignKey("budgets.id"), nullable=False)
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    description = Column(String, nullable=False)
    planned_amount = Column(Float, nullable=False)
    is_paid = Column(Boolean, nullable=False, default=False)
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    budget = relationship("BudgetModel", back_populates="items")
    category = relationship("CategoryModel", back_populates="budget_items")
    transaction = relationship("TransactionModel", back_populates="budget_items")
