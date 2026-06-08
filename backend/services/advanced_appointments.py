"""
services/advanced_appointments.py — Advanced appointment management
Recurring appointments, waiting list, conflict detection, duration estimation
"""
import structlog
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import joinedload

from models.appointment import Appointment, AppointmentStatus
from models.advanced_appointments import (
    WaitingListEntry, WaitingListStatus,
    RecurringAppointmentTemplate,
)
from models.patient import Patient
from models.doctor import Doctor
from utils.prayer_times import should_avoid_scheduling

logger = structlog.get_logger()


def detect_conflicts(
    existing: List[Appointment],
    proposed_start: datetime,
    proposed_duration: int,
    appointment_id: Optional[str] = None,
) -> List[Dict]:
    """
    Detect scheduling conflicts with existing appointments.
    Returns list of conflicting appointments.
    """
    proposed_end = proposed_start + timedelta(minutes=proposed_duration)
    conflicts = []

    for appt in existing:
        if appointment_id and appt.id == appointment_id:
            continue
        if appt.status in (AppointmentStatus.CANCELLED,):
            continue

        existing_end = appt.scheduled_at + timedelta(minutes=appt.duration_min)
        if proposed_start < existing_end and proposed_end > appt.scheduled_at:
            conflicts.append({
                "conflicting_appointment_id": appt.id,
                "scheduled_at": appt.scheduled_at.isoformat(),
                "duration_min": appt.duration_min,
                "status": appt.status.value,
            })

    return conflicts


async def find_available_slots(
    doctor: Doctor,
    target_date: date,
    db: AsyncSession,
    duration_min: int = 20,
) -> List[str]:
    """Find available time slots for a doctor on a given date, avoiding conflicts."""
    day_name = target_date.strftime("%a").lower()
    slots_data = doctor.available_slots or {}
    day_slots = slots_data.get(day_name, [])

    if not day_slots:
        return []

    result = await db.execute(
        select(Appointment).where(
            Appointment.doctor_id == doctor.id,
            Appointment.scheduled_at >= datetime.combine(target_date, datetime.min.time()),
            Appointment.scheduled_at < datetime.combine(target_date + timedelta(days=1), datetime.min.time()),
            Appointment.status.notin_([AppointmentStatus.CANCELLED]),
        )
    )
    existing = result.scalars().all()

    booked_times = set()
    for appt in existing:
        booked_times.add(appt.scheduled_at.strftime("%H:%M"))

    available = [s for s in day_slots if s not in booked_times]
    return available


async def generate_recurring_instances(
    template: RecurringAppointmentTemplate,
    db: AsyncSession,
) -> List[Appointment]:
    """
    Generate individual Appointment instances from a recurring template.
    Returns the list of created appointments.
    """
    from datetime import date as date_type

    current = template.start_date
    if isinstance(current, datetime):
        current = current.date()
    end = template.end_date
    if isinstance(end, datetime):
        end = end.date()
    if end is None:
        end = current + timedelta(days=365)

    created = []
    while current <= end:
        hour, minute = map(int, template.time_of_day.split(":"))
        scheduled = datetime.combine(current, datetime.min.time().replace(hour=hour, minute=minute))

        avoid, reason = should_avoid_scheduling(scheduled)
        if avoid:
            logger.info("Skipping blocked slot", date=str(current), reason=reason)
            current += timedelta(days=1)
            continue

        existing = await db.execute(
            select(Appointment).where(
                Appointment.doctor_id == template.doctor_id,
                Appointment.scheduled_at == scheduled,
                Appointment.status.notin_([AppointmentStatus.CANCELLED]),
            )
        )
        if existing.scalar_one_or_none():
            logger.info("Slot already booked, skipping", date=str(current), time=template.time_of_day)
            current += timedelta(days=1)
            continue

        appt = Appointment(
            clinic_id=template.clinic_id,
            doctor_id=template.doctor_id,
            patient_id=template.patient_id,
            scheduled_at=scheduled,
            duration_min=template.duration_min,
            status=AppointmentStatus.CONFIRMED,
            notes=template.notes,
        )
        db.add(appt)
        created.append(appt)

        if template.frequency == "daily":
            current += timedelta(days=template.interval)
        elif template.frequency == "weekly":
            current += timedelta(days=7 * template.interval)
        elif template.frequency == "monthly":
            month = current.month + template.interval
            year = current.year + (month - 1) // 12
            month = ((month - 1) % 12) + 1
            day = min(current.day, 28)
            current = current.replace(year=year, month=month, day=day)
        else:
            current += timedelta(days=7)

    await db.flush()
    logger.info("Generated recurring appointments", count=len(created), template_id=template.id)
    return created


async def add_to_waiting_list(
    clinic_id: str,
    doctor_id: str,
    patient_id: str,
    preferred_date: date,
    preferred_time_start: Optional[str] = None,
    preferred_time_end: Optional[str] = None,
    notes: Optional[str] = None,
    db: Optional[AsyncSession] = None,
) -> WaitingListEntry:
    """Add a patient to the waiting list for a doctor on a preferred date."""
    entry = WaitingListEntry(
        clinic_id=clinic_id,
        doctor_id=doctor_id,
        patient_id=patient_id,
        preferred_date=preferred_date,
        preferred_time_start=preferred_time_start,
        preferred_time_end=preferred_time_end,
        notes=notes,
    )
    db.add(entry)
    await db.flush()
    logger.info("Added to waiting list", entry_id=entry.id)
    return entry


async def promote_from_waiting_list(
    doctor_id: str,
    target_date: date,
    target_time: str,
    db: AsyncSession,
) -> Optional[WaitingListEntry]:
    """
    Find the next waiting patient for a newly opened slot.
    Returns the promoted entry (marked as notified).
    """
    result = await db.execute(
        select(WaitingListEntry).where(
            WaitingListEntry.doctor_id == doctor_id,
            WaitingListEntry.preferred_date == target_date,
            WaitingListEntry.status == WaitingListStatus.WAITING,
        ).order_by(WaitingListEntry.created_at.asc())
    )
    entry = result.scalar_one_or_none()

    if entry:
        entry.status = WaitingListStatus.NOTIFIED
        await db.flush()
        logger.info("Promoted from waiting list", entry_id=entry.id, slot=target_time)

    return entry


async def estimate_appointment_duration(
    patient_id: str,
    doctor: Doctor,
    complaint_text: str,
    db: AsyncSession,
) -> int:
    """
    Estimate appointment duration based on complaint type and patient history.
    Returns duration in minutes.
    """
    duration = doctor.slot_duration_minutes or 20
    text_lower = complaint_text.lower()

    complex_indicators = [
        "multiple", "chronic", "several", "many", "complex",
        "একাধিক", "দীর্ঘমেয়াদী", "জটিল", "বহু", "পুরনো",
    ]
    simple_indicators = [
        "just", "quick", "only", "simple", "routine", "follow.up", "checkup",
        "শুধু", "দ্রুত", "সহজ", "রুটিন", "ফলোআপ", "চেকআপ",
    ]

    for indicator in complex_indicators:
        if indicator in text_lower:
            duration = min(duration + 10, 45)
            break

    for indicator in simple_indicators:
        if indicator in text_lower:
            duration = max(duration - 5, 10)
            break

    return duration
