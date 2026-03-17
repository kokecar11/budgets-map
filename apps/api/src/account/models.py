import datetime
from sqlalchemy import Column, ForeignKey, Float, String, DateTime, Boolean, event, func
from sqlalchemy.orm import relationship
from src.core.utils import generate_uuid
from src.core.database import Base
from src.core.mixins import TimestampMixin


class AccountModel(TimestampMixin, Base):
    __tablename__ = "accounts"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # ENUM: bank|cash|digital_wallet
    balance = Column(Float, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("UserModel", back_populates="accounts")
    transactions = relationship(
        "TransactionModel",
        back_populates="account",
        foreign_keys="[TransactionModel.account_id]",
    )
    transactions_destination = relationship(
        "TransactionModel",
        back_populates="transfer_destination",
        foreign_keys="[TransactionModel.transfer_to_account_id]",
    )
