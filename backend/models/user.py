"""
models/user.py — Clinic staff user model (for dashboard auth)
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.base import Base


class UserRole(str, enum.Enum):
    ADMIN      = "admin"       # Clinic owner / manager
    RECEPTIONIST = "receptionist"
    DOCTOR     = "doctor"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str]       = mapped_column(String(36),  primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    phone: Mapped[str]    = mapped_column(String(20),  nullable=False, unique=True, index=True)
    name: Mapped[str]     = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.RECEPTIONIST)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # OTP Auth — no password stored
    otp_hash: Mapped[str]            = mapped_column(String(255), nullable=True)
    otp_expires_at: Mapped[datetime] = mapped_column(DateTime,    nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_login: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    clinic: Mapped["Clinic"] = relationship("Clinic", back_populates="users")  # noqa: F821

    def __repr__(self) -> str:
        return f"<User {self.name} [{self.role}] @ clinic {self.clinic_id[:8]}>"
