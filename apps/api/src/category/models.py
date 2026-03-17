import datetime
from sqlalchemy import Column, ForeignKey, String, DateTime, event, func
from sqlalchemy.orm import relationship
from src.core.utils import generate_uuid
from src.core.database import Base
from src.core.mixins import TimestampMixin


class CategoryModel(TimestampMixin, Base):
    __tablename__ = "categories"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # ENUM: income|expense
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("UserModel", back_populates="categories")
    transactions = relationship("TransactionModel", back_populates="category")
    budget_items = relationship("BudgetItemModel", back_populates="category")
    credit_card_transactions = relationship(
        "CreditCardTransactionModel", back_populates="category"
    )
