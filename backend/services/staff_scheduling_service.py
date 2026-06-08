import structlog
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from models.staff_scheduling import (
    DoctorSchedule, ShiftOverride, Unavailability,
    DayOfWeek, ShiftType, TimeOffStatus,
)

logger = structlog.get_logger()


async def get_doctor_weekly_schedule(
    clinic_id: str,
    db: AsyncSession,
    doctor_id: Optional[str] = None,
) -> Dict:
    """Get the weekly schedule template for doctors."""
    conditions = [DoctorSchedule.clinic_id == clinic_id, DoctorSchedule.is_active == True]
    if doctor_id:
        conditions.append(DoctorSchedule.doctor_id == doctor_id)

    query = select(DoctorSchedule).where(and_(*conditions)).order_by(DoctorSchedule.day_of_week, DoctorSchedule.start_time)
    result = await db.execute(query)
    schedules = result.scalars().all()

    by_day = {day.value: [] for day in DayOfWeek}
    for s in schedules:
        by_day[s.day_of_week.value].append({
            "id": s.id,
            "doctor_id": s.doctor_id,
            "shift_type": s.shift_type.value,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "max_patients": s.max_patients,
            "room_number": s.room_number,
        })

    return {
        "clinic_id": clinic_id,
        "schedule": by_day,
    }


async def get_doctor_availability(
    clinic_id: str,
    doctor_id: str,
    target_date: date,
    db: AsyncSession,
) -> Dict:
    """Get a doctor's availability for a specific date, factoring in schedules, overrides, and time-off."""
    day_name = target_date.strftime("%a").lower()[:3]

    try:
        dow = DayOfWeek(day_name)
    except ValueError:
        return {"date": target_date.isoformat(), "available": False, "slots": []}

    timeoff = await db.execute(
        select(Unavailability).where(
            Unavailability.doctor_id == doctor_id,
            Unavailability.status == TimeOffStatus.APPROVED,
            Unavailability.start_date <= target_date,
            Unavailability.end_date >= target_date,
        )
    )
    if timeoff.scalar_one_or_none():
        return {"date": target_date.isoformat(), "available": False, "reason": "on_leave"}

    schedule = await db.execute(
        select(DoctorSchedule).where(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.day_of_week == dow,
            DoctorSchedule.is_active == True,
        )
    )
    base_schedule = schedule.scalars().all()

    override = await db.execute(
        select(ShiftOverride).where(
            ShiftOverride.doctor_id == doctor_id,
            ShiftOverride.shift_date == target_date,
        )
    )
    overrides = override.scalars().all()

    if not base_schedule and not overrides:
        return {"date": target_date.isoformat(), "available": False, "reason": "no_schedule"}

    shifts = []
    if overrides:
        for ov in overrides:
            shifts.append({
                "shift_type": ov.shift_type.value,
                "start_time": ov.start_time,
                "end_time": ov.end_time,
                "max_patients": ov.max_patients or 20,
                "override_type": ov.override_type,
            })
    else:
        for s in base_schedule:
            shifts.append({
                "shift_type": s.shift_type.value,
                "start_time": s.start_time,
                "end_time": s.end_time,
                "max_patients": s.max_patients,
            })

    return {
        "date": target_date.isoformat(),
        "doctor_id": doctor_id,
        "available": True,
        "shifts": shifts,
    }


async def request_time_off(
    clinic_id: str,
    doctor_id: str,
    start_date: date,
    end_date: date,
    db: AsyncSession,
    reason: Optional[str] = None,
    reason_bn: Optional[str] = None,
) -> Unavailability:
    """Submit a time-off/unavailability request."""
    entry = Unavailability(
        clinic_id=clinic_id,
        doctor_id=doctor_id,
        start_date=start_date,
        end_date=end_date,
        reason=reason,
        reason_bn=reason_bn,
        status=TimeOffStatus.PENDING,
    )
    db.add(entry)
    await db.flush()
    logger.info("Time-off requested", doctor_id=doctor_id, start=start_date.isoformat(), end=end_date.isoformat())
    return entry


async def approve_time_off(
    entry_id: str,
    db: AsyncSession,
    approved_by: Optional[str] = None,
    notes: Optional[str] = None,
) -> Unavailability:
    """Approve a time-off request."""
    result = await db.execute(select(Unavailability).where(Unavailability.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise ValueError("Time-off entry not found")
    if entry.status != TimeOffStatus.PENDING:
        raise ValueError(f"Cannot approve entry with status: {entry.status.value}")

    entry.status = TimeOffStatus.APPROVED
    entry.approved_by = approved_by
    entry.notes = notes
    await db.flush()
    logger.info("Time-off approved", entry_id=entry_id)
    return entry
