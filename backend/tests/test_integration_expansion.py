"""
Tests for Integration & Expansion — EHR, Telemedicine, Pharmacy, Emergency
"""
from datetime import datetime, date, timedelta

from models.ehr import (
    MedicalRecord, VitalSign, Diagnosis, Prescription, Allergy, Immunization, FamilyHistory,
    VisitType, VitalSignUnit, AllergySeverity, DiagnosisType,
)
from models.telemedicine import TelemedicineSession, SessionStatus
from models.pharmacy import PharmacyOrder, PharmacyOrderItem, DispenseStatus, DeliveryStatus
from models.emergency import EmergencyCase, AmbulanceDispatch, TriageLevel, EmergencyStatus, AmbulanceStatus


# ── EHR ─────────────────────────────────────────────────────────────────────

class TestMedicalRecord:
    def test_create_record(self):
        record = MedicalRecord(
            clinic_id="clinic-1",
            patient_id="pat-1",
            doctor_id="doc-1",
            visit_date=date.today(),
            visit_type=VisitType.NEW,
            chief_complaint="Fever and cough for 3 days",
            assessment="Upper respiratory tract infection",
            plan="Prescribed antibiotics, rest, and fluids",
        )
        assert record.visit_type == VisitType.NEW
        assert record.chief_complaint == "Fever and cough for 3 days"
        assert record.assessment == "Upper respiratory tract infection"

    def test_visit_types(self):
        record = MedicalRecord(
            clinic_id="clinic-1", patient_id="pat-1", doctor_id="doc-1",
            visit_date=date.today(), visit_type=VisitType.FOLLOW_UP,
        )
        assert record.visit_type == VisitType.FOLLOW_UP

        record.visit_type = VisitType.EMERGENCY
        assert record.visit_type == VisitType.EMERGENCY

    def test_bangla_complaint(self):
        record = MedicalRecord(
            clinic_id="clinic-1", patient_id="pat-1", doctor_id="doc-1",
            visit_date=date.today(), visit_type=VisitType.NEW,
            chief_complaint_bn="জ্বর ও কাশি",
        )
        assert record.chief_complaint_bn == "জ্বর ও কাশি"


class TestVitalSign:
    def test_create_vital(self):
        vital = VitalSign(
            record_id="rec-1",
            parameter_name="Blood Pressure",
            value=120.0,
            unit=VitalSignUnit.MMHG,
        )
        assert vital.parameter_name == "Blood Pressure"
        assert vital.value == 120.0
        assert vital.unit == VitalSignUnit.MMHG

    def test_temperature_vital(self):
        vital = VitalSign(
            record_id="rec-1",
            parameter_name="Temperature",
            value=38.5,
            unit=VitalSignUnit.CELSIUS,
        )
        assert vital.value == 38.5


class TestDiagnosis:
    def test_create_diagnosis(self):
        diag = Diagnosis(
            record_id="rec-1",
            diagnosis_name="Essential hypertension",
            icd_code="I10",
            diagnosis_type=DiagnosisType.PRIMARY,
        )
        assert diag.icd_code == "I10"
        assert diag.diagnosis_type == DiagnosisType.PRIMARY

    def test_diagnosis_types(self):
        for dt in DiagnosisType:
            diag = Diagnosis(record_id="r1", diagnosis_name="Test", diagnosis_type=dt)
            assert diag.diagnosis_type == dt


class TestPrescription:
    def test_create_prescription(self):
        rx = Prescription(
            record_id="rec-1",
            medicine_name="Amoxicillin",
            dosage="500mg",
            frequency="three times daily",
            duration_days=7,
            route="oral",
            instructions="Take after meals",
            instructions_bn="খাবারের পর সেবন করুন",
            is_active=True,
        )
        assert rx.medicine_name == "Amoxicillin"
        assert rx.dosage == "500mg"
        assert rx.duration_days == 7
        assert rx.instructions_bn == "খাবারের পর সেবন করুন"
        assert rx.is_active is True


class TestAllergy:
    def test_create_allergy(self):
        allergy = Allergy(
            patient_id="pat-1",
            allergen="Penicillin",
            severity=AllergySeverity.SEVERE,
            reaction="Anaphylaxis",
            is_active=True,
        )
        assert allergy.allergen == "Penicillin"
        assert allergy.severity == AllergySeverity.SEVERE
        assert allergy.is_active is True

    def test_severity_levels(self):
        for sev in AllergySeverity:
            a = Allergy(patient_id="p1", allergen="Test", severity=sev)
            assert a.severity == sev


class TestImmunization:
    def test_create_immunization(self):
        imm = Immunization(
            patient_id="pat-1",
            vaccine_name="COVID-19 Pfizer",
            dose_number=2,
            administered_date=date.today() - timedelta(days=180),
            next_due_date=date.today() + timedelta(days=185),
            administered_by="Dr. Rahman",
            batch_number="BNT162B2-789",
        )
        assert imm.vaccine_name == "COVID-19 Pfizer"
        assert imm.dose_number == 2
        assert imm.batch_number == "BNT162B2-789"

    def test_overdue_immunization(self):
        imm = Immunization(
            patient_id="pat-1",
            vaccine_name="Tetanus",
            dose_number=1,
            administered_date=date.today() - timedelta(days=400),
            next_due_date=date.today() - timedelta(days=30),
        )
        assert imm.next_due_date < date.today()


class TestFamilyHistory:
    def test_create_family_history(self):
        fh = FamilyHistory(
            patient_id="pat-1",
            relationship="father",
            condition="Diabetes Type 2",
            condition_bn="ডায়াবেটিস টাইপ ২",
        )
        assert fh.relationship == "father"
        assert fh.condition_bn == "ডায়াবেটিস টাইপ ২"


# ── Telemedicine ────────────────────────────────────────────────────────────

class TestTelemedicineSession:
    def test_create_session(self):
        session = TelemedicineSession(
            clinic_id="clinic-1",
            patient_id="pat-1",
            doctor_id="doc-1",
            scheduled_at=datetime(2026, 6, 15, 10, 0),
            duration_min=20,
            status=SessionStatus.SCHEDULED,
            meeting_url="https://meet.example.com/room-1",
            room_name="room-1",
        )
        assert session.status == SessionStatus.SCHEDULED
        assert session.duration_min == 20
        assert session.meeting_url == "https://meet.example.com/room-1"

    def test_session_status_lifecycle(self):
        session = TelemedicineSession(
            clinic_id="c1", patient_id="p1", doctor_id="d1",
            scheduled_at=datetime.utcnow(),
            status=SessionStatus.SCHEDULED,
        )
        assert session.status == SessionStatus.SCHEDULED

        session.status = SessionStatus.IN_PROGRESS
        assert session.status == SessionStatus.IN_PROGRESS

        session.status = SessionStatus.COMPLETED
        assert session.status == SessionStatus.COMPLETED

        session.status = SessionStatus.CANCELLED
        assert session.status == SessionStatus.CANCELLED

    def test_session_default_values(self):
        session = TelemedicineSession(
            clinic_id="c1", patient_id="p1", doctor_id="d1",
            scheduled_at=datetime.utcnow(),
            status=SessionStatus.SCHEDULED,
            duration_min=20,
            provider="internal",
        )
        assert session.duration_min == 20
        assert session.provider == "internal"


# ── Pharmacy ────────────────────────────────────────────────────────────────

class TestPharmacyOrder:
    def test_create_order(self):
        order = PharmacyOrder(
            clinic_id="clinic-1",
            patient_id="pat-1",
            order_number="RX-202606-0001",
            dispense_status=DispenseStatus.PENDING,
            delivery_address="123 Gulshan Avenue, Dhaka",
            delivery_fee=60,
            is_paid=False,
        )
        assert order.order_number == "RX-202606-0001"
        assert order.dispense_status == DispenseStatus.PENDING
        assert order.delivery_fee == 60
        assert order.is_paid is False

    def test_dispense_status_lifecycle(self):
        order = PharmacyOrder(
            clinic_id="c1", patient_id="p1",
            order_number="RX-202606-0002",
            dispense_status=DispenseStatus.PENDING,
        )
        order.dispense_status = DispenseStatus.DISPENSED
        assert order.dispense_status == DispenseStatus.DISPENSED

        order.dispense_status = DispenseStatus.CANCELLED
        assert order.dispense_status == DispenseStatus.CANCELLED


class TestPharmacyOrderItem:
    def test_create_item(self):
        item = PharmacyOrderItem(
            order_id="order-1",
            medicine_name="Paracetamol",
            dosage="500mg",
            quantity=10,
            unit_price=2,
            total_price=20,
            is_dispensed=False,
        )
        assert item.medicine_name == "Paracetamol"
        assert item.quantity == 10
        assert item.total_price == 20
        assert item.is_dispensed is False

    def test_dispensed_flag(self):
        item = PharmacyOrderItem(
            order_id="o1", medicine_name="Test", dosage="1mg",
            quantity=5, unit_price=10, total_price=50,
        )
        item.is_dispensed = True
        assert item.is_dispensed is True


# ── Emergency Room ──────────────────────────────────────────────────────────

class TestEmergencyCase:
    def test_create_case(self):
        case = EmergencyCase(
            clinic_id="clinic-1",
            case_number="ER-20260608-0001",
            triage_level=TriageLevel.EMERGENCY,
            status=EmergencyStatus.TRIAGED,
            patient_name="Rahim Mia",
            age=45,
            gender="male",
            chief_complaint="Severe chest pain radiating to left arm",
            triaged_by="Dr. Hasan",
        )
        assert case.case_number == "ER-20260608-0001"
        assert case.triage_level == TriageLevel.EMERGENCY
        assert case.status == EmergencyStatus.TRIAGED
        assert case.age == 45

    def test_triage_levels(self):
        for tl in TriageLevel:
            case = EmergencyCase(
                clinic_id="c1", case_number=f"ER-{tl.value}",
                triage_level=tl, status=EmergencyStatus.TRIAGED,
                chief_complaint="Test",
            )
            assert case.triage_level == tl

    def test_status_lifecycle(self):
        case = EmergencyCase(
            clinic_id="c1", case_number="ER-001",
            triage_level=TriageLevel.URGENT, status=EmergencyStatus.TRIAGED,
            chief_complaint="Test",
        )
        case.status = EmergencyStatus.IN_TREATMENT
        assert case.status == EmergencyStatus.IN_TREATMENT

        case.status = EmergencyStatus.ADMITTED
        assert case.status == EmergencyStatus.ADMITTED

        case.status = EmergencyStatus.DISCHARGED
        assert case.status == EmergencyStatus.DISCHARGED

    def test_bangla_complaint(self):
        case = EmergencyCase(
            clinic_id="c1", case_number="ER-002",
            triage_level=TriageLevel.URGENT, status=EmergencyStatus.TRIAGED,
            chief_complaint="Test",
            chief_complaint_bn="বুকে প্রচণ্ড ব্যথা",
        )
        assert case.chief_complaint_bn == "বুকে প্রচণ্ড ব্যথা"


class TestAmbulanceDispatch:
    def test_create_dispatch(self):
        dispatch = AmbulanceDispatch(
            clinic_id="clinic-1",
            case_id="case-1",
            ambulance_id="AMB-001",
            driver_name="Karim Driver",
            driver_phone="01712345678",
            pickup_address="House 5, Road 10, Banani, Dhaka",
            destination="City Hospital, Gulshan",
            status=AmbulanceStatus.DISPATCHED,
        )
        assert dispatch.ambulance_id == "AMB-001"
        assert dispatch.driver_name == "Karim Driver"
        assert dispatch.status == AmbulanceStatus.DISPATCHED
        assert "City Hospital" in dispatch.destination

    def test_ambulance_status_lifecycle(self):
        d = AmbulanceDispatch(
            clinic_id="c1", case_id="c1",
            pickup_address="A", destination="B",
            status=AmbulanceStatus.DISPATCHED,
        )
        d.status = AmbulanceStatus.EN_ROUTE
        assert d.status == AmbulanceStatus.EN_ROUTE

        d.status = AmbulanceStatus.ARRIVED
        assert d.status == AmbulanceStatus.ARRIVED

        d.status = AmbulanceStatus.AT_HOSPITAL
        assert d.status == AmbulanceStatus.AT_HOSPITAL
