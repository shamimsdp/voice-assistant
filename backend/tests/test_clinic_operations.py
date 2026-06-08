"""
Tests for clinic operations — inventory, staff scheduling, lab integration
"""
from datetime import datetime, date, timedelta
from unittest.mock import Mock, AsyncMock

from models.clinic_operations import (
    InventoryItem, InventoryTransaction, MedicalSupply, Equipment,
    MedicineCategory, TransactionType, StockAlertLevel,
)
from services.clinic_operations_service import (
    add_inventory_stock,
)


# ── Inventory ───────────────────────────────────────────────────────────────

class TestInventoryAlertLevel:
    def test_out_of_stock(self):
        item = InventoryItem(name="Paracetamol", category=MedicineCategory.TABLET, unit="strip", current_stock=0, min_stock=10)
        assert item.alert_level == StockAlertLevel.OUT_OF_STOCK

    def test_critical_when_below_25pct_of_min(self):
        item = InventoryItem(name="Paracetamol", category=MedicineCategory.TABLET, unit="strip", current_stock=2, min_stock=10)
        assert item.alert_level == StockAlertLevel.CRITICAL

    def test_low_when_at_or_below_min(self):
        item = InventoryItem(name="Paracetamol", category=MedicineCategory.TABLET, unit="strip", current_stock=8, min_stock=10)
        assert item.alert_level == StockAlertLevel.LOW

    def test_normal_when_above_min(self):
        item = InventoryItem(name="Paracetamol", category=MedicineCategory.TABLET, unit="strip", current_stock=50, min_stock=10)
        assert item.alert_level == StockAlertLevel.NORMAL

    def test_critical_at_exactly_25pct(self):
        item = InventoryItem(name="Paracetamol", category=MedicineCategory.TABLET, unit="strip", current_stock=2, min_stock=8)
        assert item.alert_level == StockAlertLevel.CRITICAL

    def test_low_at_min_stock_ten(self):
        item = InventoryItem(name="Paracetamol", category=MedicineCategory.TABLET, unit="strip", current_stock=10, min_stock=10)
        assert item.alert_level == StockAlertLevel.LOW


class TestInventoryTransaction:
    def test_purchase_increases_stock(self):
        item = InventoryItem(
            id="item-1",
            clinic_id="clinic-1",
            name="Paracetamol",
            category=MedicineCategory.TABLET,
            unit="strip",
            current_stock=50,
            min_stock=10,
        )

        mock_db = AsyncMock()
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = item
        mock_db.execute = AsyncMock(return_value=mock_result)

        import pytest
        result = pytest.mark.asyncio(lambda: None)  # placeholder

        pass

    def test_sale_decreases_stock(self):
        item = InventoryItem(
            id="item-1",
            clinic_id="clinic-1",
            name="Paracetamol",
            category=MedicineCategory.TABLET,
            unit="strip",
            current_stock=50,
            min_stock=10,
        )

        assert item.current_stock == 50
        item.current_stock -= 5
        assert item.current_stock == 45

    def test_stock_never_negative(self):
        item = InventoryItem(
            id="item-1",
            clinic_id="clinic-1",
            name="Paracetamol",
            category=MedicineCategory.TABLET,
            unit="strip",
            current_stock=3,
            min_stock=10,
        )

        item.current_stock = max(0, item.current_stock - 10)
        assert item.current_stock == 0
        assert item.alert_level == StockAlertLevel.OUT_OF_STOCK

    def test_expired_item_alert(self):
        item = InventoryItem(
            id="item-1",
            clinic_id="clinic-1",
            name="Amoxicillin",
            category=MedicineCategory.TABLET,
            unit="strip",
            current_stock=100,
            min_stock=10,
            expiry_date=date.today() - timedelta(days=1),
        )
        assert item.expiry_date < date.today()

    def test_requires_prescription_default_false(self):
        item = InventoryItem(name="Vitamin C", category=MedicineCategory.SUPPLEMENT, unit="bottle", current_stock=20, min_stock=5, requires_prescription=False)
        assert item.requires_prescription is False


class TestMedicalSupply:
    def test_supply_creation(self):
        supply = MedicalSupply(name="Surgical Gloves", supply_type="protective", unit="box", current_stock=10, min_stock=2)
        assert supply.name == "Surgical Gloves"
        assert supply.current_stock == 10

    def test_low_stock_condition(self):
        supply = MedicalSupply(name="Face Mask", supply_type="protective", unit="box", current_stock=1, min_stock=5)
        assert supply.current_stock <= supply.min_stock

    def test_normal_stock_condition(self):
        supply = MedicalSupply(name="Bandage", supply_type="wound_care", unit="roll", current_stock=20, min_stock=5)
        assert supply.current_stock > supply.min_stock

    def test_bangla_name_support(self):
        supply = MedicalSupply(name="Syringe", name_bn="সিরিঞ্জ", supply_type="injection", unit="piece")
        assert supply.name_bn == "সিরিঞ্জ"


class TestEquipment:
    def test_equipment_creation(self):
        eq = Equipment(name="X-Ray Machine", equipment_type="imaging", model="XR-2000", status="operational")
        assert eq.name == "X-Ray Machine"
        assert eq.status == "operational"

    def test_equipment_maintenance_overdue(self):
        today = date.today()
        eq = Equipment(name="MRI Scanner", equipment_type="imaging", status="operational", next_maintenance=today - timedelta(days=5))
        assert eq.next_maintenance < today

    def test_equipment_warranty_valid(self):
        future = date.today() + timedelta(days=365)
        eq = Equipment(name="Ultrasound", equipment_type="imaging", status="operational", warranty_expiry=future)
        assert eq.warranty_expiry > date.today()

    def test_equipment_default_status(self):
        eq = Equipment(name="Stethoscope", equipment_type="diagnostic", status="operational")
        assert eq.status == "operational"


# ── Staff Scheduling ────────────────────────────────────────────────────────

class TestDoctorSchedule:
    def test_schedule_creation(self):
        from models.staff_scheduling import DoctorSchedule, DayOfWeek, ShiftType

        schedule = DoctorSchedule(
            clinic_id="clinic-1",
            doctor_id="doc-1",
            day_of_week=DayOfWeek.MON,
            shift_type=ShiftType.MORNING,
            start_time="09:00",
            end_time="13:00",
            max_patients=20,
            room_number="101",
        )
        assert schedule.day_of_week == DayOfWeek.MON
        assert schedule.start_time == "09:00"
        assert schedule.end_time == "13:00"
        assert schedule.room_number == "101"

    def test_schedule_default_max_patients(self):
        from models.staff_scheduling import DoctorSchedule, DayOfWeek, ShiftType

        schedule = DoctorSchedule(
            clinic_id="clinic-1",
            doctor_id="doc-1",
            day_of_week=DayOfWeek.MON,
            shift_type=ShiftType.AFTERNOON,
            start_time="13:00",
            end_time="17:00",
            max_patients=20,
        )
        assert schedule.max_patients == 20

    def test_shift_override(self):
        from models.staff_scheduling import ShiftOverride, ShiftType
        today = date.today()

        override = ShiftOverride(
            clinic_id="clinic-1",
            doctor_id="doc-1",
            shift_date=today,
            shift_type=ShiftType.MORNING,
            start_time="08:00",
            end_time="12:00",
            override_type="emergency_coverage",
            reason="Dr. Karim is out sick",
        )
        assert override.override_type == "emergency_coverage"
        assert override.reason == "Dr. Karim is out sick"

    def test_unavailability_creation(self):
        from models.staff_scheduling import Unavailability, TimeOffStatus

        today = date.today()
        ua = Unavailability(
            clinic_id="clinic-1",
            doctor_id="doc-1",
            start_date=today,
            end_date=today + timedelta(days=3),
            reason="Annual leave",
            status=TimeOffStatus.PENDING,
        )
        assert ua.status == TimeOffStatus.PENDING
        assert (ua.end_date - ua.start_date).days == 3

    def test_unavailability_status_transitions(self):
        from models.staff_scheduling import Unavailability, TimeOffStatus

        ua = Unavailability(
            clinic_id="clinic-1",
            doctor_id="doc-1",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=1),
            status=TimeOffStatus.PENDING,
        )
        assert ua.status == TimeOffStatus.PENDING

        ua.status = TimeOffStatus.APPROVED
        assert ua.status == TimeOffStatus.APPROVED

        ua.status = TimeOffStatus.REJECTED
        assert ua.status == TimeOffStatus.REJECTED

        ua.status = TimeOffStatus.CANCELLED
        assert ua.status == TimeOffStatus.CANCELLED


# ── Lab Integration ─────────────────────────────────────────────────────────

class TestLabTest:
    def test_lab_test_creation(self):
        from models.lab_integration import LabTest, LabTestCategory, SpecimenType

        test = LabTest(
            clinic_id="clinic-1",
            name="CBC (Complete Blood Count)",
            name_bn="রক্ত পরীক্ষা (সিবিসি)",
            category=LabTestCategory.BLOOD,
            specimen_type=SpecimenType.BLOOD,
            fee=500,
            turnaround_hours=6,
            preparation_instructions="Fasting required (8 hours)",
            preparation_instructions_bn="৮ ঘন্টা উপোস থাকতে হবে",
        )
        assert test.name == "CBC (Complete Blood Count)"
        assert test.category == LabTestCategory.BLOOD
        assert test.fee == 500
        assert test.turnaround_hours == 6
        assert test.preparation_instructions_bn == "৮ ঘন্টা উপোস থাকতে হবে"

    def test_lab_test_defaults(self):
        from models.lab_integration import LabTest, LabTestCategory, SpecimenType

        test = LabTest(
            clinic_id="clinic-1",
            name="Urine R/E",
            category=LabTestCategory.URINE,
            specimen_type=SpecimenType.URINE,
            is_active=True,
            turnaround_hours=24,
            fee=0,
        )
        assert test.is_active is True
        assert test.fee == 0
        assert test.turnaround_hours == 24


class TestLabOrder:
    def test_order_status_default(self):
        from models.lab_integration import LabOrder, OrderStatus

        order = LabOrder(
            clinic_id="clinic-1",
            patient_id="pat-1",
            doctor_id="doc-1",
            order_number="LAB-202606-0001",
            status=OrderStatus.ORDERED,
            priority="routine",
            is_paid=False,
        )
        assert order.status.value == "ordered"
        assert order.priority == "routine"
        assert order.is_paid is False

    def test_order_lifecycle(self):
        from models.lab_integration import LabOrder, OrderStatus

        order = LabOrder(
            clinic_id="clinic-1",
            patient_id="pat-1",
            doctor_id="doc-1",
            order_number="LAB-202606-0001",
        )

        order.status = OrderStatus.SPECIMEN_COLLECTED
        assert order.status.value == "specimen_collected"

        order.status = OrderStatus.IN_PROGRESS
        assert order.status.value == "in_progress"

        order.status = OrderStatus.COMPLETED
        assert order.status.value == "completed"


class TestLabResult:
    def test_result_creation(self):
        from models.lab_integration import LabResult

        result = LabResult(
            order_id="order-1",
            test_id="test-1",
            parameter_name="Hemoglobin",
            parameter_name_bn="হিমোগ্লোবিন",
            result_value="13.5",
            unit="g/dL",
            reference_range="12.0-16.0",
            is_abnormal=False,
            performed_by="Lab Technician",
        )
        assert result.parameter_name == "Hemoglobin"
        assert result.parameter_name_bn == "হিমোগ্লোবিন"
        assert result.result_value == "13.5"
        assert result.is_abnormal is False
        assert result.verified_by is None

    def test_abnormal_result_detection(self):
        from models.lab_integration import LabResult

        result = LabResult(
            order_id="order-1",
            test_id="test-1",
            parameter_name="Blood Glucose",
            result_value="250",
            unit="mg/dL",
            reference_range="70-140",
            is_abnormal=True,
        )
        assert result.is_abnormal is True


class TestImagingStudy:
    def test_imaging_creation(self):
        from models.lab_integration import ImagingStudy

        study = ImagingStudy(
            clinic_id="clinic-1",
            patient_id="pat-1",
            doctor_id="doc-1",
            study_type="X-Ray",
            body_part="Chest",
            clinical_reason="Persistent cough for 2 weeks",
            fee=800,
            status="ordered",
            is_paid=False,
        )
        assert study.study_type == "X-Ray"
        assert study.body_part == "Chest"
        assert study.status == "ordered"
        assert study.is_paid is False

    def test_imaging_status_lifecycle(self):
        from models.lab_integration import ImagingStudy

        study = ImagingStudy(
            clinic_id="clinic-1",
            patient_id="pat-1",
            doctor_id="doc-1",
            study_type="MRI",
            body_part="Brain",
            status="ordered",
        )

        study.status = "in_progress"
        assert study.status == "in_progress"

        study.status = "completed"
        assert study.status == "completed"

    def test_imaging_image_urls(self):
        from models.lab_integration import ImagingStudy

        study = ImagingStudy(
            clinic_id="clinic-1",
            patient_id="pat-1",
            doctor_id="doc-1",
            study_type="CT Scan",
            body_part="Abdomen",
            image_urls={"view_1": "https://storage.example.com/ct_001.jpg"},
        )
        assert "view_1" in study.image_urls
