"""
Tests for advanced appointments — waiting list, conflict detection,
symptom matching, recurring appointments, duration estimation
"""
from datetime import datetime, date


from services.advanced_appointments import (
    detect_conflicts,
    estimate_appointment_duration,
)
from services.symptom_matcher import (
    _extract_symptoms,
    _get_target_specialties,
)
from models.appointment import Appointment, AppointmentStatus
from models.doctor import Doctor
from models.advanced_appointments import (
    WaitingListEntry, WaitingListStatus,
    RecurringAppointmentTemplate,
)


# ── Conflict Detection ────────────────────────────────────────────────────────

class TestConflictDetection:
    def test_no_conflict_with_empty_list(self):
        result = detect_conflicts([], datetime(2026, 6, 10, 10, 0), 20)
        assert result == []

    def test_no_conflict_when_slots_dont_overlap(self):
        existing = [
            _make_appt("1", datetime(2026, 6, 10, 9, 0), 20),
            _make_appt("2", datetime(2026, 6, 10, 10, 30), 20),
        ]
        result = detect_conflicts(existing, datetime(2026, 6, 10, 10, 0), 20)
        assert result == []

    def test_conflict_detected(self):
        existing = [
            _make_appt("1", datetime(2026, 6, 10, 10, 0), 30),
        ]
        result = detect_conflicts(existing, datetime(2026, 6, 10, 10, 15), 20)
        assert len(result) == 1
        assert result[0]["conflicting_appointment_id"] == "1"

    def test_ignores_cancelled_appointments(self):
        existing = [
            _make_appt("1", datetime(2026, 6, 10, 10, 0), 30, status=AppointmentStatus.CANCELLED),
        ]
        result = detect_conflicts(existing, datetime(2026, 6, 10, 10, 15), 20)
        assert result == []

    def test_ignores_self_when_updating(self):
        existing = [
            _make_appt("1", datetime(2026, 6, 10, 10, 0), 30),
        ]
        result = detect_conflicts(existing, datetime(2026, 6, 10, 10, 0), 30, appointment_id="1")
        assert result == []

    def test_exact_overlap_detected(self):
        existing = [
            _make_appt("1", datetime(2026, 6, 10, 10, 0), 20),
        ]
        result = detect_conflicts(existing, datetime(2026, 6, 10, 10, 0), 20)
        assert len(result) == 1


# ── Symptom Matching ──────────────────────────────────────────────────────────

class TestSymptomExtraction:
    def test_extract_english_symptom(self):
        symptoms = _extract_symptoms("I have chest pain and fever")
        assert "chest pain" in symptoms
        assert "fever" in symptoms

    def test_extract_bangla_symptom(self):
        symptoms = _extract_symptoms("আমার জ্বর এবং কাশি হয়েছে")
        assert "জ্বর" in symptoms
        assert "কাশি" in symptoms

    def test_no_symptoms_returns_empty(self):
        symptoms = _extract_symptoms("Hello, I want to book an appointment")
        assert symptoms == []

    def test_mixed_language_symptoms(self):
        symptoms = _extract_symptoms("আমার fever এবং headache হয়েছে")
        assert "fever" in symptoms
        assert "headache" in symptoms


class TestSpecialtyMapping:
    def test_fever_maps_to_medicine(self):
        specialties = _get_target_specialties(["fever"])
        assert "medicine" in specialties

    def test_chest_pain_maps_to_cardiology(self):
        specialties = _get_target_specialties(["chest pain"])
        assert "cardiology" in specialties

    def test_multiple_symptoms_merge_specialties(self):
        specialties = _get_target_specialties(["skin rash", "cough"])
        assert "dermatology" in specialties
        assert "medicine" in specialties

    def test_bangla_symptom_maps_correctly(self):
        specialties = _get_target_specialties(["ডায়াবেটিস"])
        assert "endocrinology" in specialties


# ── Duration Estimation ───────────────────────────────────────────────────────

class TestDurationEstimation:
    def test_default_duration(self):
        doctor = Doctor(slot_duration_minutes=20)
        duration = estimate_appointment_duration("patient-1", doctor, "checkup", None)
        assert duration == 15

    def test_complaint_increases_duration(self):
        doctor = Doctor(slot_duration_minutes=20)
        duration = estimate_appointment_duration("patient-1", doctor, "I have multiple chronic problems", None)
        assert duration > 20

    def test_simple_followup_reduces_duration(self):
        doctor = Doctor(slot_duration_minutes=20)
        duration = estimate_appointment_duration("patient-1", doctor, "just a routine follow up", None)
        assert duration == 15

    def test_bangla_complex_indicator(self):
        doctor = Doctor(slot_duration_minutes=20)
        duration = estimate_appointment_duration("patient-1", doctor, "একাধিক জটিল সমস্যা", None)
        assert duration >= 25

    def test_minimum_duration_floor(self):
        doctor = Doctor(slot_duration_minutes=10)
        duration = estimate_appointment_duration("patient-1", doctor, "just a quick simple routine only", None)
        assert duration >= 10


# ── Waiting List ──────────────────────────────────────────────────────────────

class TestWaitingList:
    def test_create_waiting_entry(self):
        entry = WaitingListEntry(
            clinic_id="clinic-1",
            doctor_id="doc-1",
            patient_id="patient-1",
            preferred_date=date(2026, 6, 15),
            preferred_time_start="09:00",
            preferred_time_end="12:00",
            status=WaitingListStatus.WAITING,
        )
        assert entry.status == WaitingListStatus.WAITING
        assert entry.clinic_id == "clinic-1"

    def test_waiting_entry_status_transition(self):
        entry = WaitingListEntry(
            clinic_id="clinic-1",
            doctor_id="doc-1",
            patient_id="patient-1",
            preferred_date=date(2026, 6, 15),
            status=WaitingListStatus.WAITING,
        )
        entry.status = WaitingListStatus.NOTIFIED
        assert entry.status == WaitingListStatus.NOTIFIED


# ── Recurring Template ────────────────────────────────────────────────────────

class TestRecurringTemplate:
    def test_create_recurring_template(self):
        template = RecurringAppointmentTemplate(
            clinic_id="clinic-1",
            doctor_id="doc-1",
            patient_id="patient-1",
            start_date=date(2026, 7, 1),
            end_date=date(2026, 9, 30),
            time_of_day="10:00",
            duration_min=20,
            frequency="weekly",
            is_active=True,
        )
        assert template.is_active
        assert template.frequency == "weekly"

    def test_recurring_template_defaults(self):
        template = RecurringAppointmentTemplate(
            clinic_id="clinic-1",
            doctor_id="doc-1",
            patient_id="patient-1",
            start_date=date(2026, 7, 1),
            time_of_day="09:30",
            duration_min=20,
            frequency="daily",
            interval=1,
        )
        assert template.interval == 1
        assert template.end_date is None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_appt(
    appt_id: str,
    scheduled_at: datetime,
    duration_min: int = 20,
    status: AppointmentStatus = AppointmentStatus.CONFIRMED,
) -> Appointment:
    return Appointment(
        id=appt_id,
        clinic_id="clinic-1",
        doctor_id="doc-1",
        patient_id="patient-1",
        scheduled_at=scheduled_at,
        duration_min=duration_min,
        status=status,
    )
