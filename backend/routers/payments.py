"""
routers/payments.py — bKash payment, invoice, insurance, financial reporting
"""
import structlog
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from db.base import get_db
from models.appointment import Appointment, PaymentStatus
from models.patient import Patient
from models.payment import InsuranceProvider, Invoice, InvoiceStatus
from services.bkash_service import create_payment, execute_payment
from services.payment_service import (
    generate_invoice,
    compute_financial_report,
    process_insurance_claim,
    submit_insurance_claim,
    process_bkash_refund,
    get_payment_history,
)
from routers.auth import get_current_user
from models.user import User
from config import get_settings

router = APIRouter()
logger = structlog.get_logger()
settings = get_settings()


# ── Request / Response Models ─────────────────────────────────────────────────

class InitiatePaymentBody(BaseModel):
    appointment_id: str
    amount: int


class RefundBody(BaseModel):
    amount: int
    reason: str


class InvoiceBody(BaseModel):
    appointment_id: str
    line_items: Optional[list[dict]] = None
    tax_pct: float = 0.0
    discount: int = 0


class InsuranceClaimBody(BaseModel):
    appointment_id: str
    patient_id: str
    provider: InsuranceProvider
    policy_number: str
    claim_amount: int
    diagnosis_code: Optional[str] = None
    treatment_code: Optional[str] = None
    notes: Optional[str] = None


# ── bKash Payment Endpoints ───────────────────────────────────────────────────

@router.post("/initiate")
async def initiate_bkash_payment(
    body: InitiatePaymentBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Initiate a bKash payment for an appointment deposit."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == body.appointment_id,
            Appointment.clinic_id == current_user.clinic_id,
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    callback_url = f"{settings.webhook_base_url}/api/payments/callback"

    try:
        bkash_resp = await create_payment(
            amount=body.amount,
            appointment_id=body.appointment_id,
            patient_phone=appt.patient_id,
            callback_url=callback_url,
        )

        if bkash_resp.get("statusCode") != "0000":
            raise HTTPException(status_code=400, detail=f"bKash error: {bkash_resp.get('statusMessage')}")

        appt.bkash_payment_id = bkash_resp["paymentID"]
        appt.payment_status = PaymentStatus.INITIATED
        await db.flush()

        return {
            "payment_id": bkash_resp["paymentID"],
            "bkash_url": bkash_resp.get("bkashURL"),
            "status": "initiated",
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("bKash initiation failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Payment initiation failed")


@router.get("/callback")
async def bkash_callback(
    paymentID: str = Query(...),
    status: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """bKash redirect callback after customer completes payment."""
    result = await db.execute(
        select(Appointment).where(Appointment.bkash_payment_id == paymentID)
    )
    appt = result.scalar_one_or_none()

    if not appt:
        return {"error": "Appointment not found"}

    if status != "success":
        appt.payment_status = PaymentStatus.UNPAID
        await db.flush()
        return {"status": "cancelled", "appointment_id": appt.id}

    try:
        execute_resp = await execute_payment(paymentID)

        if execute_resp.get("statusCode") == "0000":
            appt.payment_status = PaymentStatus.PAID
            appt.bkash_trx_id = execute_resp.get("trxID")
            await db.flush()
            logger.info("bKash payment successful", trx_id=appt.bkash_trx_id)
            return {"status": "paid", "trx_id": appt.bkash_trx_id, "appointment_id": appt.id}
        else:
            appt.payment_status = PaymentStatus.UNPAID
            await db.flush()
            return {"status": "failed", "message": execute_resp.get("statusMessage")}

    except Exception as exc:
        logger.error("bKash execute failed", error=str(exc))
        return {"status": "error", "message": str(exc)}


@router.post("/{appointment_id}/refund")
async def refund_bkash_payment(
    appointment_id: str,
    body: RefundBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Refund a bKash payment for an appointment."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.clinic_id == current_user.clinic_id,
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    try:
        bkash_resp = await process_bkash_refund(appt, body.amount, body.reason, db)
        return {
            "appointment_id": appointment_id,
            "status": "refunded" if bkash_resp.get("statusCode") == "0000" else "failed",
            "bkash_response": bkash_resp,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as exc:
        logger.error("bKash refund failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Refund failed")


@router.get("/{appointment_id}/status")
async def payment_status(
    appointment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get payment status for an appointment."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.clinic_id == current_user.clinic_id,
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")

    return {
        "appointment_id": appointment_id,
        "payment_status": appt.payment_status.value,
        "bkash_payment_id": appt.bkash_payment_id,
        "bkash_trx_id": appt.bkash_trx_id,
        "advance_amount": appt.advance_amount,
        "consultation_fee": appt.consultation_fee,
    }


# ── Invoice Endpoints ─────────────────────────────────────────────────────────

@router.post("/invoices")
async def create_invoice(
    body: InvoiceBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate an invoice for a completed appointment."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == body.appointment_id,
            Appointment.clinic_id == current_user.clinic_id,
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = await db.get(Patient, appt.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    invoice = await generate_invoice(
        appointment=appt,
        patient=patient,
        db=db,
        line_items=body.line_items,
        tax_pct=body.tax_pct,
        discount=body.discount,
    )

    return {
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "total_bdt": invoice.total,
        "status": invoice.status.value,
        "issued_at": invoice.issued_at.isoformat() if invoice.issued_at else None,
        "due_at": invoice.due_at.isoformat() if invoice.due_at else None,
    }


@router.get("/invoices")
async def list_invoices(
    status: Optional[InvoiceStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List invoices for the current clinic."""
    query = select(Invoice).where(Invoice.clinic_id == current_user.clinic_id)
    if status:
        query = query.where(Invoice.status == status)
    query = query.order_by(Invoice.created_at.desc()).limit(50)

    result = await db.execute(query)
    invoices = result.scalars().all()

    return [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "total": inv.total,
            "status": inv.status.value,
            "issued_at": inv.issued_at.isoformat() if inv.issued_at else None,
        }
        for inv in invoices
    ]


# ── Insurance Claim Endpoints ─────────────────────────────────────────────────

@router.post("/insurance-claims")
async def create_insurance_claim(
    body: InsuranceClaimBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create an insurance claim for an appointment."""
    claim = await process_insurance_claim(
        clinic_id=current_user.clinic_id,
        patient_id=body.patient_id,
        appointment_id=body.appointment_id,
        provider=body.provider,
        policy_number=body.policy_number,
        claim_amount=body.claim_amount,
        db=db,
        diagnosis_code=body.diagnosis_code,
        treatment_code=body.treatment_code,
        notes=body.notes,
    )

    return {
        "claim_id": claim.id,
        "status": claim.status.value,
        "claim_amount": claim.claim_amount,
        "provider": claim.provider.value,
    }


@router.post("/insurance-claims/{claim_id}/submit")
async def submit_claim(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a draft insurance claim."""
    try:
        claim = await submit_insurance_claim(claim_id, db)
        return {"claim_id": claim.id, "status": claim.status.value}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/insurance-claims")
async def list_insurance_claims(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List insurance claims for the clinic."""
    from models.payment import InsuranceClaim, ClaimStatus

    query = select(InsuranceClaim).where(InsuranceClaim.clinic_id == current_user.clinic_id)
    if status:
        query = query.where(InsuranceClaim.status == ClaimStatus(status))
    query = query.order_by(InsuranceClaim.created_at.desc()).limit(50)

    result = await db.execute(query)
    claims = result.scalars().all()

    return [
        {
            "id": c.id,
            "provider": c.provider.value,
            "claim_amount": c.claim_amount,
            "status": c.status.value,
            "submitted_at": c.submitted_at.isoformat() if c.submitted_at else None,
        }
        for c in claims
    ]


# ── Financial Report Endpoints ────────────────────────────────────────────────

@router.get("/reports/financial")
async def get_financial_report(
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compute financial report for a date range."""
    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    return await compute_financial_report(
        clinic_id=current_user.clinic_id,
        db=db,
        start_date=start,
        end_date=end,
    )


@router.get("/history")
async def get_history(
    days: int = Query(30, ge=1, le=365),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """View payment history with patient details."""
    ps = PaymentStatus(status) if status else None
    return await get_payment_history(
        clinic_id=current_user.clinic_id,
        db=db,
        days=days,
        status=ps,
    )
