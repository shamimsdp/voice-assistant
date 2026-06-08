"""
services/analytics_service.py — Analytics & reporting engine
No-show prediction, NPS scoring, KPI computation, demographic trends
"""
import structlog
import statistics
from datetime import datetime, timedelta, date
from typing import Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.appointment import Appointment, AppointmentStatus
from models.patient import Patient
from models.doctor import Doctor
from models.call_log import CallLog

logger = structlog.get_logger()

NO_SHOW_FACTORS = {
    "history_no_show_weight": 3.0,
    "morning_slot_weight": 0.3,
    "late_slot_weight": 0.6,
    "monday_factor": 0.4,
    "friday_afternoon_factor": 0.5,
    "same_day_booking_boost": -0.3,
    "previous_no_show_boost": 1.0,
    "new_patient_boost": 0.3,
}


async def predict_no_show_risk(
    appointment: Appointment,
    patient: Patient,
    db: AsyncSession,
) -> float:
    """
    Predict no-show probability (0.0-1.0) based on historical patterns.
    Higher score = more likely to no-show.
    """
    risk = 0.0
    weight = 0.0

    hour = appointment.scheduled_at.hour
    day_of_week = appointment.scheduled_at.weekday()

    if hour < 10:
        risk += NO_SHOW_FACTORS["morning_slot_weight"]
        weight += 1.0
    elif hour >= 17:
        risk += NO_SHOW_FACTORS["late_slot_weight"]
        weight += 1.0

    if day_of_week == 0:
        risk += NO_SHOW_FACTORS["monday_factor"]
        weight += 1.0
    elif day_of_week == 4 and hour >= 12:
        risk += NO_SHOW_FACTORS["friday_afternoon_factor"]
        weight += 1.0

    patient_history = await db.execute(
        select(Appointment).where(
            Appointment.patient_id == patient.id,
            Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.NO_SHOW, AppointmentStatus.COMPLETED]),
        )
    )
    past = patient_history.scalars().all()
    if past:
        no_shows = sum(1 for a in past if a.status == AppointmentStatus.NO_SHOW)
        total = len(past)
        no_show_rate = no_shows / total
        risk += no_show_rate * NO_SHOW_FACTORS["history_no_show_weight"]
        weight += NO_SHOW_FACTORS["history_no_show_weight"]

        if no_shows > 0:
            risk += NO_SHOW_FACTORS["previous_no_show_boost"]
            weight += 1.0

    created_hour = appointment.created_at.hour if hasattr(appointment, 'created_at') else 0
    scheduled_hour = appointment.scheduled_at.hour
    hours_ahead = scheduled_hour - created_hour
    if hours_ahead <= 2:
        risk += NO_SHOW_FACTORS["same_day_booking_boost"]
        weight += 1.0

    risk = max(0.0, min(1.0, risk / max(weight, 1.0)))
    return round(risk, 2)


async def compute_kpi_dashboard(
    clinic_id: str,
    db: AsyncSession,
    days: int = 30,
) -> Dict:
    """Compute all KPI metrics for the clinic dashboard."""
    since = datetime.utcnow() - timedelta(days=days)

    apps = await db.execute(
        select(Appointment).where(
            Appointment.clinic_id == clinic_id,
            Appointment.scheduled_at >= since,
        )
    )
    appointments = apps.scalars().all()
    total = len(appointments)
    confirmed = sum(1 for a in appointments if a.status == AppointmentStatus.CONFIRMED)
    completed = sum(1 for a in appointments if a.status == AppointmentStatus.COMPLETED)
    no_shows = sum(1 for a in appointments if a.status == AppointmentStatus.NO_SHOW)
    cancelled = sum(1 for a in appointments if a.status == AppointmentStatus.CANCELLED)

    calls = await db.execute(
        select(CallLog).where(
            CallLog.clinic_id == clinic_id,
            CallLog.started_at >= since,
        )
    )
    call_logs = calls.scalars().all()
    total_calls = len(call_logs)
    calls_booked = sum(1 for c in call_logs if c.appointment_booked)

    total_revenue = sum(a.consultation_fee for a in appointments if a.status in (
        AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED
    ))
    collected = sum(a.advance_amount for a in appointments if a.payment_status == "paid")

    utilization_rate = (completed / total * 100) if total > 0 else 0
    no_show_rate = (no_shows / total * 100) if total > 0 else 0
    booking_rate = (calls_booked / total_calls * 100) if total_calls > 0 else 0
    cancellation_rate = (cancelled / total * 100) if total > 0 else 0

    nps_scores = [a.satisfaction_nps for a in appointments if a.satisfaction_nps is not None]
    avg_nps = round(statistics.mean(nps_scores), 1) if nps_scores else None
    promoters = sum(1 for s in nps_scores if s >= 9)
    detractors = sum(1 for s in nps_scores if s <= 6)
    total_responses = len(nps_scores)
    nps_score = round(
        ((promoters - detractors) / total_responses) * 100, 1
    ) if total_responses > 0 else None

    return {
        "period_days": days,
        "appointments": {
            "total": total,
            "confirmed": confirmed,
            "completed": completed,
            "no_shows": no_shows,
            "cancelled": cancelled,
            "utilization_rate_pct": round(utilization_rate, 1),
            "no_show_rate_pct": round(no_show_rate, 1),
            "cancellation_rate_pct": round(cancellation_rate, 1),
        },
        "calls": {
            "total": total_calls,
            "booked": calls_booked,
            "booking_rate_pct": round(booking_rate, 1),
        },
        "revenue": {
            "total_booked_bdt": int(total_revenue),
            "collected_bdt": int(collected),
            "collection_rate_pct": round((collected / total_revenue * 100), 1) if total_revenue > 0 else 0,
        },
        "satisfaction": {
            "avg_nps": avg_nps,
            "nps_score": nps_score,
            "total_responses": total_responses,
            "promoters": promoters,
            "detractors": detractors,
        },
    }


async def compute_demographics(
    clinic_id: str,
    db: AsyncSession,
) -> Dict:
    """Compute patient demographics: age/gender distribution, top districts."""
    patients = await db.execute(
        select(Patient).where(Patient.is_active.is_(True))
    )
    all_patients = patients.scalars().all()

    clinic_patients = []
    for p in all_patients:
        appt_check = await db.execute(
            select(Appointment).where(
                Appointment.patient_id == p.id,
                Appointment.clinic_id == clinic_id,
            ).limit(1)
        )
        if appt_check.scalar_one_or_none():
            clinic_patients.append(p)

    total = len(clinic_patients)
    gender_dist = {}
    age_groups = {"0-18": 0, "19-35": 0, "36-60": 0, "60+": 0, "unknown": 0}
    language_dist = {}

    for p in clinic_patients:
        g = p.gender or "unknown"
        gender_dist[g] = gender_dist.get(g, 0) + 1

        lang = p.preferred_language or "unknown"
        language_dist[lang] = language_dist.get(lang, 0) + 1

        if p.date_of_birth:
            age = datetime.now().year - p.date_of_birth.year
            if age <= 18:
                age_groups["0-18"] += 1
            elif age <= 35:
                age_groups["19-35"] += 1
            elif age <= 60:
                age_groups["36-60"] += 1
            else:
                age_groups["60+"] += 1
        else:
            age_groups["unknown"] += 1

    return {
        "total_patients": total,
        "gender_distribution": gender_dist,
        "age_groups": age_groups,
        "language_distribution": language_dist,
    }


async def compute_trends(
    clinic_id: str,
    db: AsyncSession,
    months: int = 6,
) -> Dict:
    """Identify health trends from appointment notes and symptoms."""
    since = datetime.utcnow() - timedelta(days=30 * months)

    apps = await db.execute(
        select(Appointment).where(
            Appointment.clinic_id == clinic_id,
            Appointment.scheduled_at >= since,
        ).order_by(Appointment.scheduled_at)
    )
    appointments = apps.scalars().all()

    monthly_volume = {}
    specialty_demand = {}
    status_distribution = {}

    for a in appointments:
        month_key = a.scheduled_at.strftime("%Y-%m")
        monthly_volume[month_key] = monthly_volume.get(month_key, 0) + 1

        status_distribution[a.status.value] = status_distribution.get(a.status.value, 0) + 1

    doctors = await db.execute(
        select(Doctor).where(Doctor.clinic_id == clinic_id)
    )
    for doc in doctors.scalars().all():
        spec = doc.specialty or "general"
        specialty_demand[spec] = specialty_demand.get(spec, 0)

    for a in appointments:
        doc_result = await db.execute(select(Doctor).where(Doctor.id == a.doctor_id))
        doc = doc_result.scalar_one_or_none()
        if doc:
            spec = doc.specialty or "general"
            specialty_demand[spec] = specialty_demand.get(spec, 0) + 1

    sorted_specialties = sorted(specialty_demand.items(), key=lambda x: x[1], reverse=True)

    return {
        "period_months": months,
        "monthly_appointment_volume": monthly_volume,
        "top_specialties": [
            {"specialty": spec, "appointments": count}
            for spec, count in sorted_specialties[:10]
        ],
        "status_distribution": status_distribution,
    }


async def compute_predictive_staffing(
    clinic_id: str,
    db: AsyncSession,
    target_date: date,
) -> Dict:
    """Predict optimal staffing levels for a given date based on historical patterns."""
    day_of_week = target_date.strftime("%A")

    since = target_date - timedelta(days=90)
    apps = await db.execute(
        select(Appointment).where(
            Appointment.clinic_id == clinic_id,
            Appointment.scheduled_at >= since,
        )
    )
    appointments = apps.scalars().all()

    same_day_appts = [
        a for a in appointments
        if a.scheduled_at.weekday() == target_date.weekday()
    ]
    avg_daily = len(same_day_appts) / max(len(set(
        a.scheduled_at.date() for a in same_day_appts
    ) or [target_date]), 1)

    hourly_distribution = {}
    for a in same_day_appts:
        h = a.scheduled_at.hour
        hourly_distribution[h] = hourly_distribution.get(h, 0) + 1

    peak_hours = sorted(hourly_distribution.items(), key=lambda x: x[1], reverse=True)[:3]

    total_appts_last_month = max(len([
        a for a in appointments
        if a.scheduled_at >= datetime.utcnow() - timedelta(days=30)
    ]), 1)
    growth_factor = len(appointments) / total_appts_last_month if len(appointments) > 0 else 1.0

    predicted = round(avg_daily * growth_factor)

    return {
        "target_date": target_date.isoformat(),
        "day_of_week": day_of_week,
        "predicted_appointments": predicted,
        "historical_avg": round(avg_daily, 1),
        "growth_factor": round(growth_factor, 2),
        "peak_hours": [
            {"hour": f"{h:02d}:00", "avg_appointments": c}
            for h, c in peak_hours
        ],
        "recommended_doctors": max(1, round(predicted / 15)),
        "recommended_staff": max(1, round(predicted / 20)),
    }


async def detect_outbreak_trends(
    clinic_id: str,
    db: AsyncSession,
    days: int = 30,
) -> Dict:
    """Detect potential outbreak trends from appointment notes/symptoms."""
    since = datetime.utcnow() - timedelta(days=days)

    apps = await db.execute(
        select(Appointment).where(
            Appointment.clinic_id == clinic_id,
            Appointment.scheduled_at >= since,
            Appointment.status != AppointmentStatus.CANCELLED,
        )
    )
    appointments = apps.scalars().all()

    symptom_counts: Dict[str, int] = {}
    weekly_counts: Dict[str, Dict[str, int]] = {}

    for a in appointments:
        notes = (a.notes or "") + " " + (a.notes_bn or "")
        notes_lower = notes.lower()

        keywords = {
            "fever/জ্বর": ["fever", "জ্বর", "high temp"],
            "cough/কাশি": ["cough", "কাশি", "coughing"],
            "cold/সর্দি": ["cold", "সর্দি", "runny nose"],
            "diarrhea/ডায়রিয়া": ["diarrhea", "ডায়রিয়া", "loose motion", "পাতলা পায়খানা"],
            "breathing issue/শ্বাসকষ্ট": ["breathing", "শ্বাসকষ্ট", "shortness of breath"],
            "skin rash/চর্মরোগ": ["rash", "চর্মরোগ", "skin infection"],
            "body ache/গা ব্যথা": ["body ache", "গা ব্যথা", "muscle pain"],
            "headache/মাথা ব্যথা": ["headache", "মাথা ব্যথা"],
        }

        week = a.scheduled_at.strftime("%Y-W%W")

        for symptom_name, indicators in keywords.items():
            if any(kw in notes_lower for kw in indicators):
                symptom_counts[symptom_name] = symptom_counts.get(symptom_name, 0) + 1
                if week not in weekly_counts:
                    weekly_counts[week] = {}
                weekly_counts[week][symptom_name] = weekly_counts[week].get(symptom_name, 0) + 1

    rising = []
    sorted_weeks = sorted(weekly_counts.keys())
    if len(sorted_weeks) >= 2:
        last_week = sorted_weeks[-1]
        prev_week = sorted_weeks[-2]
        for symptom in symptom_counts:
            current = weekly_counts.get(last_week, {}).get(symptom, 0)
            previous = weekly_counts.get(prev_week, {}).get(symptom, 0)
            if previous > 0 and current >= previous * 1.5:
                rising.append({
                    "symptom": symptom,
                    "previous_week": previous,
                    "current_week": current,
                    "increase_pct": round((current - previous) / previous * 100, 1),
                })

    return {
        "period_days": days,
        "total_appointments_analyzed": len(appointments),
        "symptom_frequency": dict(sorted(
            symptom_counts.items(), key=lambda x: x[1], reverse=True
        )[:15]),
        "rising_symptoms": rising,
        "alert": len(rising) > 0,
    }
