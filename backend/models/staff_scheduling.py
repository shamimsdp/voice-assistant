import uuid
import enum
from datetime import datetime, date
from sqlalchemy import String, Boolean, DateTime, Integer, Text, ForeignKey, Enum, Date
from sqlalchemy.orm import Mapped, mapped_column
from db.base import Base


class DayOfWeek(str, enum.Enum):
    MON = "mon"
    TUE = "tue"
    WED = "wed"
    THU = "thu"
    FRI = "fri"
    SAT = "sat"
    SUN = "sun"


class ShiftType(str, enum.Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"
    NIGHT = "night"
    FULL_DAY = "full_day"


class TimeOffStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)

    day_of_week: Mapped[DayOfWeek] = mapped_column(Enum(DayOfWeek), nullable=False)
    shift_type: Mapped[ShiftType] = mapped_column(Enum(ShiftType), nullable=False)
    start_time: Mapped[str] = mapped_column(String(5), nullable=False)
    end_time: Mapped[str] = mapped_column(String(5), nullable=False)

    max_patients: Mapped[int] = mapped_column(Integer, default=20)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    room_number: Mapped[str] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<DoctorSchedule Dr.{self.doctor_id[:8]} {self.day_of_week.value} {self.shift_type.value}>"


class ShiftOverride(Base):
    __tablename__ = "shift_overrides"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)

    shift_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    shift_type: Mapped[ShiftType] = mapped_column(Enum(ShiftType), nullable=False)
    start_time: Mapped[str] = mapped_column(String(5), nullable=False)
    end_time: Mapped[str] = mapped_column(String(5), nullable=False)
    override_type: Mapped[str] = mapped_column(String(50), nullable=False)

    max_patients: Mapped[int] = mapped_column(Integer, nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<ShiftOverride Dr.{self.doctor_id[:8]} on {self.shift_date} — {self.override_type}>"


class Unavailability(Base):
    __tablename__ = "unavailability"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)

    start_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    end_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=True)
    reason_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    status: Mapped[TimeOffStatus] = mapped_column(Enum(TimeOffStatus), default=TimeOffStatus.PENDING)

    approved_by: Mapped[str] = mapped_column(String(255), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Unavailability Dr.{self.doctor_id[:8]} {self.start_date}–{self.end_date} [{self.status.value}]>"
