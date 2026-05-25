import datetime
from sqlalchemy import (
    Column,
    ForeignKey,
    Float,
    Integer,
    String,
    DateTime,
    Boolean,
    CheckConstraint,
    event,
    func,
)
from sqlalchemy.orm import relationship, backref
from src.core.utils import generate_uuid
from src.core.database import Base
from src.core.mixins import TimestampMixin


class TransactionModel(TimestampMixin, Base):
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint(
            """(
                (CASE WHEN transfer_to_account_id IS NOT NULL THEN 1 ELSE 0 END) +
                (CASE WHEN credit_card_payment_id IS NOT NULL THEN 1 ELSE 0 END) +
                (CASE WHEN loan_payment_id IS NOT NULL THEN 1 ELSE 0 END) +
                (CASE WHEN saving_goal_id IS NOT NULL THEN 1 ELSE 0 END)
            ) <= 1""",
            name="chk_transaction_single_reference",
        ),
        {"extend_existing": True},
    )

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    account_id = Column(String, ForeignKey("accounts.id"), nullable=False)
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    type = Column(String, nullable=False)  # ENUM: income|expense|transfer|saving
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)
    is_recurring = Column(Boolean, nullable=False, default=False)
    recurrence = Column(String, nullable=True)  # ENUM: none|weekly|monthly
    last_generated_at = Column(DateTime(timezone=True), nullable=True)
    recurrence_day_of_month = Column(Integer, nullable=True)
    parent_transaction_id = Column(String, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)

    # Optional FKs — solo uno puede tener valor a la vez (ver CheckConstraint)
    transfer_to_account_id = Column(String, ForeignKey("accounts.id"), nullable=True)
    credit_card_payment_id = Column(
        String, ForeignKey("credit_card_payments.id"), nullable=True
    )
    loan_payment_id = Column(String, ForeignKey("loan_payments.id"), nullable=True)
    saving_goal_id = Column(String, ForeignKey("saving_goals.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("UserModel", back_populates="transactions")
    account = relationship(
        "AccountModel",
        back_populates="transactions",
        foreign_keys="[TransactionModel.account_id]",
    )
    category = relationship("CategoryModel", back_populates="transactions")
    transfer_destination = relationship(
        "AccountModel",
        back_populates="transactions_destination",
        foreign_keys="[TransactionModel.transfer_to_account_id]",
    )
    credit_card_payment = relationship(
        "CreditCardPaymentModel", back_populates="transaction"
    )
    loan_payment = relationship("LoanPaymentModel", back_populates="transaction")
    saving_goal = relationship("SavingGoalModel", back_populates="contributions")
    budget_items = relationship("BudgetItemModel", back_populates="transaction")
    children = relationship(
        "TransactionModel",
        foreign_keys="[TransactionModel.parent_transaction_id]",
        backref=backref("parent", remote_side="TransactionModel.id"),
        lazy="select",
    )
