import structlog
from datetime import datetime, date
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from models.lab_integration import (
    LabTest, LabOrder, LabResult, ImagingStudy,
    LabTestCategory, SpecimenType, OrderStatus,
)
from models.appointment import Appointment

logger = structlog.get_logger()


async def create_lab_order(
    clinic_id: str,
    patient_id: str,
    doctor_id: str,
    test_ids: List[str],
    db: AsyncSession,
    appointment_id: Optional[str] = None,
    clinical_notes: Optional[str] = None,
    diagnosis_code: Optional[str] = None,
    priority: str = "routine",
) -> LabOrder:
    """Create a lab order with one or more tests."""
    total_fee = 0
    for test_id in test_ids:
        result = await db.execute(select(LabTest).where(LabTest.id == test_id, LabTest.is_active == True))
        test = result.scalar_one_or_none()
        if test:
            total_fee += test.fee

    order_count = await db.execute(select(func.count(LabOrder.id)))
    count = order_count.scalar() or 0
    order_number = f"LAB-{datetime.utcnow().strftime('%Y%m')}-{count + 1:04d}"

    order = LabOrder(
        clinic_id=clinic_id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        appointment_id=appointment_id,
        order_number=order_number,
        status=OrderStatus.ORDERED,
        priority=priority,
        clinical_notes=clinical_notes,
        diagnosis_code=diagnosis_code,
        total_fee=total_fee,
    )
    db.add(order)
    await db.flush()
    logger.info("Lab order created", order_number=order_number, tests=len(test_ids))
    return order


async def get_lab_orders(
    clinic_id: str,
    db: AsyncSession,
    patient_id: Optional[str] = None,
    status: Optional[OrderStatus] = None,
    limit: int = 50,
) -> List[Dict]:
    """Get lab orders with filters."""
    conditions = [LabOrder.clinic_id == clinic_id]
    if patient_id:
        conditions.append(LabOrder.patient_id == patient_id)
    if status:
        conditions.append(LabOrder.status == status)

    query = select(LabOrder).where(and_(*conditions)).order_by(LabOrder.created_at.desc()).limit(limit)
    result = await db.execute(query)
    orders = result.scalars().all()

    return [
        {
            "id": o.id,
            "order_number": o.order_number,
            "patient_id": o.patient_id,
            "doctor_id": o.doctor_id,
            "status": o.status.value,
            "priority": o.priority,
            "total_fee": o.total_fee,
            "is_paid": o.is_paid,
            "clinical_notes": o.clinical_notes,
            "ordered_at": o.ordered_at.isoformat(),
            "completed_at": o.completed_at.isoformat() if o.completed_at else None,
        }
        for o in orders
    ]


async def add_lab_result(
    order_id: str,
    test_id: str,
    parameter_name: str,
    result_value: str,
    db: AsyncSession,
    parameter_name_bn: Optional[str] = None,
    unit: Optional[str] = None,
    reference_range: Optional[str] = None,
    notes: Optional[str] = None,
    performed_by: Optional[str] = None,
) -> LabResult:
    """Add a lab result for a test within an order."""
    result = LabResult(
        order_id=order_id,
        test_id=test_id,
        parameter_name=parameter_name,
        parameter_name_bn=parameter_name_bn,
        result_value=result_value,
        unit=unit,
        reference_range=reference_range,
        notes=notes,
        performed_by=performed_by,
    )
    db.add(result)
    await db.flush()

    test_result = await db.execute(select(LabTest).where(LabTest.id == test_id))
    test = test_result.scalar_one_or_none()
    if test and test.reference_ranges:
        pass

    return result


async def complete_lab_order(
    order_id: str,
    db: AsyncSession,
    verified_by: Optional[str] = None,
) -> LabOrder:
    """Mark a lab order as completed."""
    result = await db.execute(select(LabOrder).where(LabOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise ValueError("Lab order not found")

    order.status = OrderStatus.COMPLETED
    order.completed_at = datetime.utcnow()
    await db.flush()
    logger.info("Lab order completed", order_number=order.order_number)
    return order


async def create_imaging_study(
    clinic_id: str,
    patient_id: str,
    doctor_id: str,
    study_type: str,
    body_part: str,
    db: AsyncSession,
    appointment_id: Optional[str] = None,
    clinical_reason: Optional[str] = None,
    fee: int = 0,
) -> ImagingStudy:
    """Create an imaging study order."""
    study = ImagingStudy(
        clinic_id=clinic_id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        appointment_id=appointment_id,
        study_type=study_type,
        body_part=body_part,
        clinical_reason=clinical_reason,
        status="ordered",
        fee=fee,
    )
    db.add(study)
    await db.flush()
    logger.info("Imaging study created", study_type=study_type, body_part=body_part)
    return study


async def get_imaging_studies(
    clinic_id: str,
    db: AsyncSession,
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
) -> List[Dict]:
    """Get imaging studies."""
    conditions = [ImagingStudy.clinic_id == clinic_id]
    if patient_id:
        conditions.append(ImagingStudy.patient_id == patient_id)
    if status:
        conditions.append(ImagingStudy.status == status)

    query = select(ImagingStudy).where(and_(*conditions)).order_by(ImagingStudy.created_at.desc()).limit(limit)
    result = await db.execute(query)
    studies = result.scalars().all()

    return [
        {
            "id": s.id,
            "study_type": s.study_type,
            "body_part": s.body_part,
            "status": s.status,
            "clinical_reason": s.clinical_reason,
            "findings": s.findings,
            "impression": s.impression,
            "fee": s.fee,
            "is_paid": s.is_paid,
            "ordered_at": s.ordered_at.isoformat(),
            "reported_at": s.reported_at.isoformat() if s.reported_at else None,
        }
        for s in studies
    ]


async def get_lab_tests_catalog(
    clinic_id: str,
    db: AsyncSession,
    category: Optional[LabTestCategory] = None,
) -> List[Dict]:
    """Get the lab tests catalog."""
    conditions = [LabTest.clinic_id == clinic_id, LabTest.is_active == True]
    if category:
        conditions.append(LabTest.category == category)

    query = select(LabTest).where(and_(*conditions)).order_by(LabTest.category, LabTest.name)
    result = await db.execute(query)
    tests = result.scalars().all()

    return [
        {
            "id": t.id,
            "name": t.name,
            "name_bn": t.name_bn,
            "category": t.category.value,
            "specimen_type": t.specimen_type.value,
            "fee": t.fee,
            "turnaround_hours": t.turnaround_hours,
            "preparation_instructions": t.preparation_instructions,
            "preparation_instructions_bn": t.preparation_instructions_bn,
        }
        for t in tests
    ]
