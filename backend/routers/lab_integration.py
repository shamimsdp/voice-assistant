import structlog
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from db.base import get_db
from models.lab_integration import (
    LabTest, LabOrder, LabResult, ImagingStudy,
    LabTestCategory, OrderStatus,
)
from models.user import User
from routers.auth import get_current_user
from services.lab_integration_service import (
    create_lab_order,
    get_lab_orders,
    add_lab_result,
    complete_lab_order,
    create_imaging_study,
    get_imaging_studies,
    get_lab_tests_catalog,
)

router = APIRouter()
logger = structlog.get_logger()


class CreateLabTestBody(BaseModel):
    name: str
    name_bn: Optional[str] = None
    category: LabTestCategory
    specimen_type: str
    fee: int = 0
    turnaround_hours: int = 24
    preparation_instructions: Optional[str] = None
    preparation_instructions_bn: Optional[str] = None


class CreateLabOrderBody(BaseModel):
    patient_id: str
    test_ids: list[str]
    doctor_id: str
    appointment_id: Optional[str] = None
    clinical_notes: Optional[str] = None
    diagnosis_code: Optional[str] = None
    priority: str = "routine"


class AddLabResultBody(BaseModel):
    test_id: str
    parameter_name: str
    result_value: str
    parameter_name_bn: Optional[str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    notes: Optional[str] = None
    performed_by: Optional[str] = None


class CreateImagingBody(BaseModel):
    patient_id: str
    doctor_id: str
    study_type: str
    body_part: str
    appointment_id: Optional[str] = None
    clinical_reason: Optional[str] = None
    fee: int = 0


@router.get("/tests")
async def list_tests(
    category: Optional[LabTestCategory] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_lab_tests_catalog(
        clinic_id=current_user.clinic_id,
        db=db,
        category=category,
    )


@router.post("/tests")
async def create_test(
    body: CreateLabTestBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    test = LabTest(
        clinic_id=current_user.clinic_id,
        name=body.name,
        name_bn=body.name_bn,
        category=body.category,
        specimen_type=body.specimen_type,
        fee=body.fee,
        turnaround_hours=body.turnaround_hours,
        preparation_instructions=body.preparation_instructions,
        preparation_instructions_bn=body.preparation_instructions_bn,
    )
    db.add(test)
    await db.flush()
    return {"id": test.id, "name": test.name, "category": test.category.value}


@router.post("/orders")
async def place_lab_order(
    body: CreateLabOrderBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = await create_lab_order(
        clinic_id=current_user.clinic_id,
        patient_id=body.patient_id,
        doctor_id=body.doctor_id,
        test_ids=body.test_ids,
        db=db,
        appointment_id=body.appointment_id,
        clinical_notes=body.clinical_notes,
        diagnosis_code=body.diagnosis_code,
        priority=body.priority,
    )
    return {
        "id": order.id,
        "order_number": order.order_number,
        "total_fee": order.total_fee,
        "status": order.status.value,
    }


@router.get("/orders")
async def list_orders(
    patient_id: Optional[str] = None,
    status: Optional[OrderStatus] = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_lab_orders(
        clinic_id=current_user.clinic_id,
        db=db,
        patient_id=patient_id,
        status=status,
        limit=limit,
    )


@router.get("/orders/{order_id}/results")
async def get_order_results(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(LabResult).where(LabResult.order_id == order_id)
    )
    results = result.scalars().all()

    return [
        {
            "id": r.id,
            "test_id": r.test_id,
            "parameter_name": r.parameter_name,
            "parameter_name_bn": r.parameter_name_bn,
            "result_value": r.result_value,
            "unit": r.unit,
            "reference_range": r.reference_range,
            "is_abnormal": r.is_abnormal,
            "notes": r.notes,
            "performed_by": r.performed_by,
            "verified_by": r.verified_by,
            "verified_at": r.verified_at.isoformat() if r.verified_at else None,
        }
        for r in results
    ]


@router.post("/orders/{order_id}/results")
async def add_order_result(
    order_id: str,
    body: AddLabResultBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lab_result = await add_lab_result(
        order_id=order_id,
        test_id=body.test_id,
        parameter_name=body.parameter_name,
        result_value=body.result_value,
        db=db,
        parameter_name_bn=body.parameter_name_bn,
        unit=body.unit,
        reference_range=body.reference_range,
        notes=body.notes,
        performed_by=body.performed_by or current_user.name,
    )
    return {
        "id": lab_result.id,
        "parameter_name": lab_result.parameter_name,
        "result_value": lab_result.result_value,
    }


@router.post("/orders/{order_id}/complete")
async def mark_order_complete(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        order = await complete_lab_order(
            order_id=order_id,
            db=db,
            verified_by=current_user.name,
        )
        return {"id": order.id, "status": order.status.value}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/imaging")
async def create_imaging(
    body: CreateImagingBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    study = await create_imaging_study(
        clinic_id=current_user.clinic_id,
        patient_id=body.patient_id,
        doctor_id=body.doctor_id,
        study_type=body.study_type,
        body_part=body.body_part,
        db=db,
        appointment_id=body.appointment_id,
        clinical_reason=body.clinical_reason,
        fee=body.fee,
    )
    return {"id": study.id, "study_type": study.study_type, "status": study.status}


@router.get("/imaging")
async def list_imaging(
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_imaging_studies(
        clinic_id=current_user.clinic_id,
        db=db,
        patient_id=patient_id,
        status=status,
        limit=limit,
    )
