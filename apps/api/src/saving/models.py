import datetime
from sqlalchemy import Column, ForeignKey, Float, String, DateTime, event, func
from sqlalchemy.orm import relationship
from src.core.utils import generate_uuid
from src.core.database import Base
from src.core.mixins import TimestampMixin


class SavingGoalModel(TimestampMixin, Base):
    __tablename__ = "saving_goals"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=True)
    status = Column(
        String, nullable=False, default="active"
    )  # ENUM: active|completed|cancelled
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("UserModel", back_populates="saving_goals")
    contributions = relationship("TransactionModel", back_populates="saving_goal")

    @property
    def current_amount(self) -> float:
        return sum(c.amount for c in self.contributions) if self.contributions else 0
