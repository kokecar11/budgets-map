import datetime
from sqlalchemy import Column, String, DateTime, event, func
from sqlalchemy.orm import relationship
from src.core.utils import generate_uuid
from src.core.database import Base
from src.core.mixins import TimestampMixin


class UserModel(TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    currency = Column(String, nullable=False, default="COP")
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Subscription fields
    plan = Column(String, nullable=False, default="free", server_default="free")
    lemon_squeezy_customer_id = Column(String, nullable=True)
    lemon_squeezy_subscription_id = Column(String, nullable=True)
    subscription_status = Column(String, nullable=True)
    subscription_ends_at = Column(DateTime(timezone=True), nullable=True)

    accounts = relationship("AccountModel", back_populates="user")
    categories = relationship("CategoryModel", back_populates="user")
    transactions = relationship("TransactionModel", back_populates="user")
    budgets = relationship("BudgetModel", back_populates="user")
    credit_cards = relationship("CreditCardModel", back_populates="user")
    loans = relationship("LoanModel", back_populates="user")
    saving_goals = relationship("SavingGoalModel", back_populates="user")
    permissions = relationship("PermissionModel", back_populates="user")
    financial_rules = relationship("FinancialRulesModel", back_populates="user", uselist=False)
