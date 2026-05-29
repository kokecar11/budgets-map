import datetime
from sqlalchemy import Column, ForeignKey, Float, Integer, String, DateTime, event, func
from sqlalchemy.orm import relationship
from src.core.utils import generate_uuid
from src.core.database import Base
from src.core.mixins import TimestampMixin


class CreditCardModel(TimestampMixin, Base):
    __tablename__ = "credit_cards"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    alias = Column(String, nullable=False)
    credit_limit = Column(Float, nullable=False)
    cutoff_day = Column(Integer, nullable=False)
    payment_day = Column(Integer, nullable=False)
    interest_rate = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("UserModel", back_populates="credit_cards")
    periods = relationship("CreditCardPeriodModel", back_populates="credit_card")
    transactions = relationship(
        "CreditCardTransactionModel", back_populates="credit_card"
    )
    payments = relationship("CreditCardPaymentModel", back_populates="credit_card")


class CreditCardPeriodModel(TimestampMixin, Base):
    __tablename__ = "credit_card_periods"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    credit_card_id = Column(String, ForeignKey("credit_cards.id"), nullable=False)
    period_date = Column(DateTime(timezone=True), nullable=False)
    opening_balance = Column(Float, nullable=False)
    consumed = Column(Float, nullable=False)
    minimum_payment = Column(Float, nullable=False)
    total_payment = Column(Float, nullable=False)
    closing_balance = Column(Float, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    credit_card = relationship("CreditCardModel", back_populates="periods")
    transactions = relationship("CreditCardTransactionModel", back_populates="period")
    payments = relationship("CreditCardPaymentModel", back_populates="period")


class CreditCardTransactionModel(TimestampMixin, Base):
    __tablename__ = "credit_card_transactions"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    credit_card_id = Column(String, ForeignKey("credit_cards.id"), nullable=False)
    period_id = Column(String, ForeignKey("credit_card_periods.id"), nullable=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    installments = Column(Integer, nullable=False, default=1)
    installment_number = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    credit_card = relationship("CreditCardModel", back_populates="transactions")
    period = relationship("CreditCardPeriodModel", back_populates="transactions")
    category = relationship("CategoryModel", back_populates="credit_card_transactions")
    transaction = relationship(
        "TransactionModel",
        back_populates="credit_card_transaction",
        foreign_keys="[TransactionModel.credit_card_transaction_id]",
        uselist=False,
    )


class CreditCardPaymentModel(TimestampMixin, Base):
    __tablename__ = "credit_card_payments"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    credit_card_id = Column(String, ForeignKey("credit_cards.id"), nullable=False)
    period_id = Column(String, ForeignKey("credit_card_periods.id"), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # ENUM: minimum|total|partial
    date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    credit_card = relationship("CreditCardModel", back_populates="payments")
    period = relationship("CreditCardPeriodModel", back_populates="payments")
    transaction = relationship("TransactionModel", back_populates="credit_card_payment")
