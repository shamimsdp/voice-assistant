"""
routers/analytics.py — Call and appointment analytics for the dashboard.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from db.base import get_db
from models.call_log import CallLog, CallStatus
from models.appointment import Appointment, AppointmentStatus
from routers.auth import get_current_user
from models.user import User

router = APIRouter()


@router.get("/summary")
async def get_summary(
    days: int = Query(7, ge=1, le=90, description="Number of days to look back"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dashboard summary: calls, bookings, revenue for the last N days."""
    since = datetime.utcnow() - timedelta(days=days)
    clinic_id = current_user.clinic_id

    # Total calls
    calls_result = await db.execute(
        select(func.count(CallLog.id)).where(
            CallLog.clinic_id == clinic_id,
            CallLog.started_at >= since,
        )
    )
    total_calls = calls_result.scalar() or 0

    # Calls that resulted in a booking
    booked_result = await db.execute(
        select(func.count(CallLog.id)).where(
            CallLog.clinic_id == clinic_id,
            CallLog.started_at >= since,
            CallLog.appointment_booked == True,
        )
    )
    calls_booked = booked_result.scalar() or 0

    # Total appointments
    appt_result = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.clinic_id == clinic_id,
            Appointment.created_at >= since,
        )
    )
    total_appointments = appt_result.scalar() or 0

    # Revenue (confirmed + completed appointments)
    revenue_result = await db.execute(
        select(func.sum(Appointment.advance_amount)).where(
            Appointment.clinic_id == clinic_id,
            Appointment.created_at >= since,
            Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED]),
        )
    )
    total_revenue_bdt = revenue_result.scalar() or 0

    # Average call duration
    duration_result = await db.execute(
        select(func.avg(CallLog.duration_seconds)).where(
            CallLog.clinic_id == clinic_id,
            CallLog.started_at >= since,
            CallLog.status == CallStatus.COMPLETED,
        )
    )
    avg_duration = duration_result.scalar() or 0

    booking_rate = round((calls_booked / total_calls * 100) if total_calls > 0 else 0, 1)

    return {
        "period_days": days,
        "total_calls": total_calls,
        "calls_booked": calls_booked,
        "booking_rate_pct": booking_rate,
        "total_appointments": total_appointments,
        "total_revenue_bdt": int(total_revenue_bdt),
        "avg_call_duration_seconds": int(avg_duration),
    }


@router.get("/calls-by-day")
async def calls_by_day(
    days: int = Query(14, ge=1, le=60),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Daily call volume for chart rendering."""
    since = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(
            func.date(CallLog.started_at).label("day"),
            func.count(CallLog.id).label("total"),
            func.sum(func.cast(CallLog.appointment_booked, sqlalchemy_int())).label("booked"),
        ).where(
            CallLog.clinic_id == current_user.clinic_id,
            CallLog.started_at >= since,
        ).group_by(func.date(CallLog.started_at))
        .order_by(func.date(CallLog.started_at))
    )

    return [
        {"day": str(row.day), "total": row.total, "booked": row.booked or 0}
        for row in result.all()
    ]


@router.get("/language-breakdown")
async def language_breakdown(
    days: int = Query(30, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Breakdown of call languages (bn-BD vs en-US vs other)."""
    since = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(
            CallLog.detected_language,
            func.count(CallLog.id).label("count"),
        ).where(
            CallLog.clinic_id == current_user.clinic_id,
            CallLog.started_at >= since,
        ).group_by(CallLog.detected_language)
    )

    return [{"language": row.detected_language, "count": row.count} for row in result.all()]


def sqlalchemy_int():
    from sqlalchemy import Integer
    return Integer
