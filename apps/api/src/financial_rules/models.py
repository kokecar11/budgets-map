from sqlalchemy import Column, ForeignKey, String, DateTime, func
from sqlalchemy.orm import relationship
from src.core.utils import generate_uuid
from src.core.database import Base
from src.core.mixins import TimestampMixin


class FinancialRulesModel(TimestampMixin, Base):
    __tablename__ = "financial_rules"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    # ENUM: accrual (expense when charged) | cash (expense when paid)
    expense_model = Column(String, nullable=False, default="accrual", server_default="accrual")
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("UserModel", back_populates="financial_rules")
