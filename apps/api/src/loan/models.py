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


class LoanModel(TimestampMixin, Base):
    __tablename__ = "loans"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    lender = Column(String, nullable=False)
    principal = Column(Float, nullable=False)
    balance = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)
    monthly_payment = Column(Float, nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    payment_day = Column(Integer, nullable=False)
    status = Column(String, nullable=False)  # ENUM: active|paid|defaulted
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("UserModel", back_populates="loans")
    payments = relationship("LoanPaymentModel", back_populates="loan")
    amortization = relationship("LoanAmortizationModel", back_populates="loan")


class LoanPaymentModel(TimestampMixin, Base):
    __tablename__ = "loan_payments"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    loan_id = Column(String, ForeignKey("loans.id"), nullable=False)
    amount = Column(Float, nullable=False)
    principal_paid = Column(Float, nullable=False)
    interest_paid = Column(Float, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    period = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    loan = relationship("LoanModel", back_populates="payments")
    transaction = relationship("TransactionModel", back_populates="loan_payment")


class LoanAmortizationModel(TimestampMixin, Base):
    __tablename__ = "loan_amortization"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    loan_id = Column(String, ForeignKey("loans.id"), nullable=False)
    period = Column(String, nullable=False)
    payment_number = Column(Integer, nullable=False)
    principal_payment = Column(Float, nullable=False)
    interest_payment = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)
    is_paid = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    loan = relationship("LoanModel", back_populates="amortization")
