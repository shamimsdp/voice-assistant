"""
routers/analytics_v2.py — Enhanced analytics & reporting API
KPIs, demographics, trends, no-show prediction, staffing, outbreak detection
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from db.base import get_db
from models.appointment import Appointment, AppointmentStatus
from models.patient import Patient
from models.user import User
from routers.auth import get_current_user
from services.analytics_service import (
    predict_no_show_risk,
    compute_kpi_dashboard,
    compute_demographics,
    compute_trends,
    compute_predictive_staffing,
    detect_outbreak_trends,
)
from services.sms_service import send_appointment_sms

router = APIRouter()


@router.get("/kpi")
async def get_kpi_dashboard(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Full KPI dashboard: appointments, calls, revenue, satisfaction."""
    return await compute_kpi_dashboard(
        clinic_id=current_user.clinic_id,
        db=db,
        days=days,
    )


@router.get("/demographics")
async def get_demographics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Patient demographics: age, gender, language distribution."""
    return await compute_demographics(
        clinic_id=current_user.clinic_id,
        db=db,
    )


@router.get("/trends")
async def get_trends(
    months: int = Query(6, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Health trends: monthly volume, top specialties, status distribution."""
    return await compute_trends(
        clinic_id=current_user.clinic_id,
        db=db,
        months=months,
    )


@router.get("/predictive-staffing")
async def get_predictive_staffing(
    target_date: str = Query(..., description="Date YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Predict optimal staffing levels for a target date."""
    try:
        dt = datetime.strptime(target_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    return await compute_predictive_staffing(
        clinic_id=current_user.clinic_id,
        db=db,
        target_date=dt,
    )


@router.get("/outbreak-trends")
async def get_outbreak_trends(
    days: int = Query(30, ge=7, le=180),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detect potential outbreak trends from symptom analysis."""
    return await detect_outbreak_trends(
        clinic_id=current_user.clinic_id,
        db=db,
        days=days,
    )


@router.get("/appointments/{appointment_id}/no-show-risk")
async def get_no_show_risk(
    appointment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Predict no-show risk for a specific appointment."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.clinic_id == current_user.clinic_id,
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = await db.get(Patient, appt.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    risk = await predict_no_show_risk(appt, patient, db)
    appt.no_show_risk = risk
    await db.flush()

    return {
        "appointment_id": appointment_id,
        "no_show_risk": risk,
        "risk_level": "high" if risk >= 0.6 else "medium" if risk >= 0.3 else "low",
        "recommended_action": (
            "Send extra reminder SMS"
            if risk >= 0.5
            else "Standard reminder"
        ),
    }


@router.post("/appointments/{appointment_id}/remind")
async def send_smart_reminder(
    appointment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send an intelligent reminder SMS based on no-show risk."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.clinic_id == current_user.clinic_id,
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = await db.get(Patient, appt.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    risk = await predict_no_show_risk(appt, patient, db)
    appt.no_show_risk = risk

    sent = await send_appointment_sms(
        phone=patient.phone,
        appointment_id=appt.id,
        language=patient.preferred_language,
        db=db,
    )

    if sent:
        appt.reminder_sent = True
        appt.reminder_count = (appt.reminder_count or 0) + 1
        await db.flush()

    return {
        "appointment_id": appointment_id,
        "no_show_risk": risk,
        "reminder_sent": sent,
        "reminder_count": appt.reminder_count,
    }


@router.post("/appointments/{appointment_id}/satisfaction")
async def submit_satisfaction(
    appointment_id: str,
    nps_score: int = Query(..., ge=0, le=10, description="NPS score 0-10"),
    feedback: Optional[str] = Query(None, max_length=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit patient satisfaction NPS score and feedback."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.clinic_id == current_user.clinic_id,
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.satisfaction_nps = nps_score
    if feedback:
        appt.satisfaction_feedback = feedback

    await db.flush()

    return {
        "appointment_id": appointment_id,
        "nps_score": nps_score,
        "nps_category": "promoter" if nps_score >= 9 else "passive" if nps_score >= 7 else "detractor",
    }


@router.get("/no-show-summary")
async def get_no_show_summary(
    days: int = Query(30, ge=1, le=365),
    min_risk: float = Query(0.3, ge=0.0, le=1.0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List appointments with elevated no-show risk."""
    since = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(Appointment).where(
            Appointment.clinic_id == current_user.clinic_id,
            Appointment.scheduled_at >= since,
            Appointment.status == AppointmentStatus.CONFIRMED,
        ).order_by(Appointment.scheduled_at)
    )
    appointments = result.scalars().all()

    high_risk = []
    for appt in appointments:
        patient = await db.get(Patient, appt.patient_id)
        if not patient:
            continue
        risk = await predict_no_show_risk(appt, patient, db)
        if risk >= min_risk:
            high_risk.append({
                "appointment_id": appt.id,
                "scheduled_at": appt.scheduled_at.isoformat(),
                "patient_phone": patient.phone,
                "patient_name": patient.name,
                "no_show_risk": risk,
                "reminder_sent": appt.reminder_sent,
                "reminder_count": appt.reminder_count,
            })

    return {
        "total_analyzed": len(appointments),
        "high_risk_count": len(high_risk),
        "appointments": sorted(high_risk, key=lambda x: x["no_show_risk"], reverse=True)[:50],
    }


def timedelta(*args, **kwargs):
    from datetime import timedelta as td
    return td(*args, **kwargs)
