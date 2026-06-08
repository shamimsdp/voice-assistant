"""
models/agent.py — AI Agent ORM model + Service model + AgentService junction
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.base import Base


class Service(Base):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    duration_min: Mapped[int] = mapped_column(Integer, default=30)
    price: Mapped[float] = mapped_column(Float, default=0.0)
    category: Mapped[str] = mapped_column(String(100), nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    clinic = relationship("Clinic", back_populates="services")
    agent_assignments = relationship("AgentService", back_populates="service", cascade="all, delete-orphan")


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    voice: Mapped[str] = mapped_column(String(100), default="Clara")
    tone: Mapped[str] = mapped_column(String(50), default="professional")
    greeting_message: Mapped[str] = mapped_column(Text, nullable=True)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    is_predefined: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    clinic = relationship("Clinic", back_populates="agents")
    service_assignments = relationship("AgentService", back_populates="agent", cascade="all, delete-orphan")


class AgentService(Base):
    __tablename__ = "agent_services"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id"), nullable=False)
    service_id: Mapped[str] = mapped_column(String(36), ForeignKey("services.id"), nullable=False)

    agent = relationship("Agent", back_populates="service_assignments")
    service = relationship("Service", back_populates="agent_assignments")
