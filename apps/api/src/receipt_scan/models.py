from sqlalchemy import Column, ForeignKey, String, Integer, UniqueConstraint, func, DateTime
from src.core.utils import generate_uuid
from src.core.database import Base
from src.core.mixins import TimestampMixin


class ReceiptScanUsageModel(TimestampMixin, Base):
    __tablename__ = "receipt_scan_usage"
    __table_args__ = (
        UniqueConstraint("user_id", "period", name="uq_receipt_scan_usage_user_period"),
        {"extend_existing": True},
    )

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    period = Column(String, nullable=False)   # "YYYY-MM"
    count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
