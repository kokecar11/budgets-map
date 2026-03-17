from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from src.core.database import Base
from src.core.mixins import TimestampMixin
from src.core.utils import generate_uuid


class PermissionModel(TimestampMixin, Base):
    __tablename__ = "permissions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    user = relationship("UserModel", back_populates="permissions")
