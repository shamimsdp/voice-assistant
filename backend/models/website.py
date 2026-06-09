import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from db.base import Base


class ClinicWebsite(Base):
    __tablename__ = "clinic_websites"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, unique=True, index=True)

    custom_domain: Mapped[str] = mapped_column(String(255), nullable=True)
    theme_color: Mapped[str] = mapped_column(String(7), default="#10b981")
    hero_title: Mapped[str] = mapped_column(String(255), nullable=True)
    hero_title_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    hero_subtitle: Mapped[str] = mapped_column(Text, nullable=True)
    hero_subtitle_bn: Mapped[str] = mapped_column(Text, nullable=True)
    about_text: Mapped[str] = mapped_column(Text, nullable=True)
    about_text_bn: Mapped[str] = mapped_column(Text, nullable=True)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=True)
    address: Mapped[str] = mapped_column(String(500), nullable=True)
    address_bn: Mapped[str] = mapped_column(String(500), nullable=True)
    working_hours: Mapped[str] = mapped_column(JSON, nullable=True)
    services_heading: Mapped[str] = mapped_column(String(255), nullable=True)
    services_heading_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    doctors_heading: Mapped[str] = mapped_column(String(255), nullable=True)
    doctors_heading_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    show_doctors: Mapped[bool] = mapped_column(Boolean, default=True)
    show_services: Mapped[bool] = mapped_column(Boolean, default=True)
    show_appointment_button: Mapped[bool] = mapped_column(Boolean, default=True)
    footer_text: Mapped[str] = mapped_column(String(500), nullable=True)
    footer_text_bn: Mapped[str] = mapped_column(String(500), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<ClinicWebsite {self.id[:8]} — {self.custom_domain or 'no domain'}>"
