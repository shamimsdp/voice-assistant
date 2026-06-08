"""
Tests for analytics_service.py — No-show prediction, KPI computation,
demographics, trends, predictive staffing, outbreak detection
"""
import pytest
from datetime import datetime, date
from unittest.mock import AsyncMock, Mock

from sqlalchemy.ext.asyncio import AsyncSession

from services.analytics_service import (
    predict_no_show_risk,
    compute_demographics,
    detect_outbreak_trends,
)
from models.appointment import Appointment, AppointmentStatus
from models.patient import Patient


def _mock_db(rows):
    """Create an AsyncSession mock where db.execute().scalars().all() returns rows."""
    result = Mock()
    result.scalars.return_value.all.return_value = rows
    db = AsyncMock(spec=AsyncSession)
    db.execute.return_value = result
    return db


# ── No-Show Prediction ────────────────────────────────────────────────────────

pytestmark = pytest.mark.asyncio


_NOW = datetime(2026, 6, 8, 9, 0)


class TestNoShowPrediction:
    async def test_default_risk_mid_range(self):
        appt = Appointment(
            id="apt-1",
            clinic_id="clinic-1",
            doctor_id="doc-1",
            patient_id="pat-1",
            created_at=_NOW,
            scheduled_at=datetime(2026, 6, 10, 11, 0),
            duration_min=20,
        )
        patient = Patient(id="pat-1", phone="01711111111", name="Test")
        db = _mock_db([])

        risk = await predict_no_show_risk(appt, patient, db)
        assert 0.0 <= risk <= 1.0
        assert risk <= 0.5

    async def test_morning_slot_higher_risk_than_afternoon(self):
        """Morning slots (< 10am) increase no-show risk vs afternoon."""
        appt = Appointment(
            id="apt-2",
            clinic_id="clinic-1",
            doctor_id="doc-1",
            patient_id="pat-1",
            created_at=datetime(2026, 6, 1, 0, 0),
            scheduled_at=datetime(2026, 6, 10, 8, 30),
            duration_min=20,
        )
        patient = Patient(id="pat-1", phone="01711111111", name="Test")
        db = _mock_db([])
        morning = await predict_no_show_risk(appt, patient, db)

        appt2 = Appointment(
            id="apt-3",
            clinic_id="clinic-1",
            doctor_id="doc-1",
            patient_id="pat-1",
            created_at=datetime(2026, 6, 1, 0, 0),
            scheduled_at=datetime(2026, 6, 10, 14, 0),
            duration_min=20,
        )
        afternoon = await predict_no_show_risk(appt2, patient, db)

        assert morning > afternoon

    async def test_no_show_history_increases_risk(self):
        past_no_show = Appointment(
            id="apt-past",
            clinic_id="clinic-1",
            doctor_id="doc-1",
            patient_id="pat-1",
            created_at=_NOW,
            scheduled_at=datetime(2026, 5, 1, 10, 0),
            status=AppointmentStatus.NO_SHOW,
        )
        db = _mock_db([past_no_show])

        appt = Appointment(
            id="apt-new",
            clinic_id="clinic-1",
            doctor_id="doc-1",
            patient_id="pat-1",
            created_at=_NOW,
            scheduled_at=datetime(2026, 6, 15, 10, 0),
            duration_min=20,
        )
        patient = Patient(id="pat-1", phone="01711111111", name="Test")

        risk = await predict_no_show_risk(appt, patient, db)
        assert risk > 0


# ── Demographics ──────────────────────────────────────────────────────────────

class TestDemographics:
    async def test_empty_clinic_returns_defaults(self):
        db = _mock_db([])

        result = await compute_demographics("clinic-1", db)
        assert result["total_patients"] == 0
        assert result["gender_distribution"] == {}
        assert result["age_groups"]["unknown"] == 0


# ── Outbreak Detection ────────────────────────────────────────────────────────

class TestOutbreakDetection:
    async def test_no_appointments_returns_empty(self):
        db = _mock_db([])

        result = await detect_outbreak_trends("clinic-1", db, days=30)
        assert result["total_appointments_analyzed"] == 0
        assert result["alert"] is False

    async def test_empty_notes_no_symptoms_detected(self):
        appt = Appointment(
            id="apt-1",
            clinic_id="clinic-1",
            doctor_id="doc-1",
            patient_id="pat-1",
            scheduled_at=datetime(2026, 6, 10, 10, 0),
            notes="Routine checkup",
        )
        db = _mock_db([appt])

        result = await detect_outbreak_trends("clinic-1", db, days=30)
        assert result["total_appointments_analyzed"] == 1
        assert len(result["symptom_frequency"]) == 0

    async def test_fever_detected_from_notes(self):
        appt = Appointment(
            id="apt-1",
            clinic_id="clinic-1",
            doctor_id="doc-1",
            patient_id="pat-1",
            scheduled_at=datetime(2026, 6, 10, 10, 0),
            notes="Patient has high fever and cough",
        )
        db = _mock_db([appt])

        result = await detect_outbreak_trends("clinic-1", db, days=30)
        assert "fever/জ্বর" in result["symptom_frequency"]
        assert result["symptom_frequency"]["fever/জ্বর"] == 1


# ── Predictive Staffing ───────────────────────────────────────────────────────

class TestPredictiveStaffing:
    async def test_staffing_returns_recommendations(self):
        from services.analytics_service import compute_predictive_staffing

        db = _mock_db([])

        result = await compute_predictive_staffing("clinic-1", db, date(2026, 6, 15))
        assert "target_date" in result
        assert "recommended_doctors" in result
        assert result["recommended_doctors"] >= 1
        assert result["recommended_staff"] >= 1


# ── KPI Dashboard ─────────────────────────────────────────────────────────────

class TestKPIDashboard:
    async def test_empty_clinic_returns_zeroes(self):
        from services.analytics_service import compute_kpi_dashboard

        db = _mock_db([])

        result = await compute_kpi_dashboard("clinic-1", db, days=30)
        assert result["appointments"]["total"] == 0
        assert result["appointments"]["utilization_rate_pct"] == 0.0
        assert result["calls"]["total"] == 0
        assert result["revenue"]["total_booked_bdt"] == 0
        assert result["satisfaction"]["total_responses"] == 0
