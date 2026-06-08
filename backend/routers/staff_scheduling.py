import structlog
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from db.base import get_db
from models.staff_scheduling import (
    DoctorSchedule, ShiftOverride, Unavailability,
    DayOfWeek, ShiftType, TimeOffStatus,
)
from models.user import User
from routers.auth import get_current_user
from services.staff_scheduling_service import (
    get_doctor_weekly_schedule,
    get_doctor_availability,
    request_time_off,
    approve_time_off,
)

router = APIRouter()
logger = structlog.get_logger()


class CreateScheduleBody(BaseModel):
    doctor_id: str
    day_of_week: DayOfWeek
    shift_type: ShiftType
    start_time: str
    end_time: str
    max_patients: int = 20
    room_number: Optional[str] = None


class CreateOverrideBody(BaseModel):
    doctor_id: str
    shift_date: str
    shift_type: ShiftType
    start_time: str
    end_time: str
    override_type: str
    max_patients: Optional[int] = None
    reason: Optional[str] = None


class TimeOffRequest(BaseModel):
    doctor_id: str
    start_date: str
    end_date: str
    reason: Optional[str] = None
    reason_bn: Optional[str] = None


class ApproveTimeOffBody(BaseModel):
    approved_by: Optional[str] = None
    notes: Optional[str] = None


@router.get("/weekly-schedule")
async def weekly_schedule(
    doctor_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_doctor_weekly_schedule(
        clinic_id=current_user.clinic_id,
        db=db,
        doctor_id=doctor_id,
    )


@router.post("/schedules")
async def create_schedule(
    body: CreateScheduleBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.execute(
        select(DoctorSchedule).where(
            DoctorSchedule.clinic_id == current_user.clinic_id,
            DoctorSchedule.doctor_id == body.doctor_id,
            DoctorSchedule.day_of_week == body.day_of_week,
            DoctorSchedule.shift_type == body.shift_type,
            DoctorSchedule.is_active == True,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Schedule already exists for this slot")

    schedule = DoctorSchedule(
        clinic_id=current_user.clinic_id,
        doctor_id=body.doctor_id,
        day_of_week=body.day_of_week,
        shift_type=body.shift_type,
        start_time=body.start_time,
        end_time=body.end_time,
        max_patients=body.max_patients,
        room_number=body.room_number,
    )
    db.add(schedule)
    await db.flush()
    return {"id": schedule.id, "doctor_id": body.doctor_id, "day": body.day_of_week.value}


@router.get("/availability")
async def doctor_availability(
    doctor_id: str = Query(...),
    target_date: str = Query(..., description="YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        dt = date.fromisoformat(target_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    return await get_doctor_availability(
        clinic_id=current_user.clinic_id,
        doctor_id=doctor_id,
        target_date=dt,
        db=db,
    )


@router.post("/time-off")
async def create_time_off(
    body: TimeOffRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        start = date.fromisoformat(body.start_date)
        end = date.fromisoformat(body.end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if end < start:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")

    entry = await request_time_off(
        clinic_id=current_user.clinic_id,
        doctor_id=body.doctor_id,
        start_date=start,
        end_date=end,
        db=db,
        reason=body.reason,
        reason_bn=body.reason_bn,
    )
    return {"id": entry.id, "status": entry.status.value}


@router.post("/time-off/{entry_id}/approve")
async def approve_time_off_request(
    entry_id: str,
    body: ApproveTimeOffBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        entry = await approve_time_off(
            entry_id=entry_id,
            db=db,
            approved_by=body.approved_by or current_user.name,
            notes=body.notes,
        )
        return {"id": entry.id, "status": entry.status.value}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/time-off")
async def list_time_off(
    status: Optional[TimeOffStatus] = None,
    doctor_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import and_

    conditions = [Unavailability.clinic_id == current_user.clinic_id]
    if status:
        conditions.append(Unavailability.status == status)
    if doctor_id:
        conditions.append(Unavailability.doctor_id == doctor_id)

    query = select(Unavailability).where(and_(*conditions)).order_by(Unavailability.start_date.desc())
    result = await db.execute(query)
    entries = result.scalars().all()

    return [
        {
            "id": e.id,
            "doctor_id": e.doctor_id,
            "start_date": e.start_date.isoformat(),
            "end_date": e.end_date.isoformat(),
            "reason": e.reason,
            "reason_bn": e.reason_bn,
            "status": e.status.value,
            "approved_by": e.approved_by,
        }
        for e in entries
    ]


@router.post("/overrides")
async def create_override(
    body: CreateOverrideBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        shift_date = date.fromisoformat(body.shift_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    override = ShiftOverride(
        clinic_id=current_user.clinic_id,
        doctor_id=body.doctor_id,
        shift_date=shift_date,
        shift_type=body.shift_type,
        start_time=body.start_time,
        end_time=body.end_time,
        override_type=body.override_type,
        max_patients=body.max_patients,
        reason=body.reason,
    )
    db.add(override)
    await db.flush()
    return {"id": override.id, "doctor_id": body.doctor_id, "date": body.shift_date}
