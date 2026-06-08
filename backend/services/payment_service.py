"""
services/payment_service.py — Invoice, insurance, financial reports
"""
import structlog
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from models.appointment import Appointment, PaymentStatus
from models.patient import Patient
from models.payment import (
    Invoice, InvoiceStatus,
    InsuranceClaim, InsuranceProvider, ClaimStatus,
)
from services.bkash_service import refund_payment

logger = structlog.get_logger()


async def generate_invoice(
    appointment: Appointment,
    patient: Patient,
    db: AsyncSession,
    line_items: Optional[List[Dict[str, object]]] = None,
    tax_pct: float = 0.0,
    discount: int = 0,
) -> Invoice:
    """Generate an invoice for a completed appointment."""
    if line_items is None:
        line_items = [
            {"description": "Consultation fee", "amount": appointment.consultation_fee},
        ]

    subtotal = sum(item["amount"] for item in line_items)
    tax_amount = int(subtotal * tax_pct / 100.0)
    total = subtotal + tax_amount - discount

    invoice_count = await db.execute(select(func.count(Invoice.id)))
    count = invoice_count.scalar() or 0
    invoice_number = f"INV-{datetime.utcnow().strftime('%Y%m')}-{count + 1:04d}"

    invoice = Invoice(
        clinic_id=appointment.clinic_id,
        appointment_id=appointment.id,
        patient_id=appointment.patient_id,
        invoice_number=invoice_number,
        status=InvoiceStatus.DRAFT,
        line_items=line_items,
        subtotal=subtotal,
        tax_pct=tax_pct,
        tax_amount=tax_amount,
        discount=discount,
        total=total,
        issued_at=datetime.utcnow(),
        due_at=datetime.utcnow() + timedelta(days=15),
    )
    db.add(invoice)
    await db.flush()
    logger.info("Invoice generated", invoice_number=invoice_number, total=total)
    return invoice


async def compute_financial_report(
    clinic_id: str,
    db: AsyncSession,
    start_date: date,
    end_date: date,
) -> Dict:
    """Compute financial report for a date range."""
    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())

    apps_result = await db.execute(
        select(Appointment).where(
            Appointment.clinic_id == clinic_id,
            Appointment.scheduled_at.between(start_dt, end_dt),
        )
    )
    appointments = apps_result.scalars().all()

    total_revenue = sum(a.consultation_fee for a in appointments if a.payment_status == PaymentStatus.PAID)
    collected = sum(a.advance_amount for a in appointments if a.payment_status == PaymentStatus.PAID)
    pending = sum(a.consultation_fee for a in appointments if a.payment_status == PaymentStatus.UNPAID)
    refunded = sum(a.advance_amount for a in appointments if a.payment_status == PaymentStatus.REFUNDED)

    paid_count = sum(1 for a in appointments if a.payment_status == PaymentStatus.PAID)
    unpaid_count = sum(1 for a in appointments if a.payment_status == PaymentStatus.UNPAID)
    refunded_count = sum(1 for a in appointments if a.payment_status == PaymentStatus.REFUNDED)

    invoices_result = await db.execute(
        select(Invoice).where(
            Invoice.clinic_id == clinic_id,
            Invoice.created_at.between(start_dt, end_dt),
        )
    )
    invoices = invoices_result.scalars().all()
    invoice_total = sum(i.total for i in invoices)

    return {
        "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
        "summary": {
            "total_appointments": len(appointments),
            "total_revenue_bdt": total_revenue,
            "collected_bdt": collected,
            "pending_bdt": pending,
            "refunded_bdt": refunded,
            "invoice_total_bdt": invoice_total,
            "collection_rate_pct": round((collected / total_revenue * 100) if total_revenue else 0, 1),
        },
        "breakdown": {
            "paid_count": paid_count,
            "unpaid_count": unpaid_count,
            "refunded_count": refunded_count,
        },
    }


async def process_insurance_claim(
    clinic_id: str,
    patient_id: str,
    appointment_id: str,
    provider: InsuranceProvider,
    policy_number: str,
    claim_amount: int,
    db: AsyncSession,
    diagnosis_code: Optional[str] = None,
    treatment_code: Optional[str] = None,
    notes: Optional[str] = None,
) -> InsuranceClaim:
    """Create and submit an insurance claim."""
    claim = InsuranceClaim(
        clinic_id=clinic_id,
        patient_id=patient_id,
        appointment_id=appointment_id,
        provider=provider,
        policy_number=policy_number,
        claim_amount=claim_amount,
        status=ClaimStatus.DRAFT,
        diagnosis_code=diagnosis_code,
        treatment_code=treatment_code,
        notes=notes,
    )
    db.add(claim)
    await db.flush()
    logger.info("Insurance claim created", claim_id=claim.id, provider=provider.value)
    return claim


async def submit_insurance_claim(
    claim_id: str,
    db: AsyncSession,
) -> InsuranceClaim:
    """Submit a draft claim to the insurance provider."""
    result = await db.execute(select(InsuranceClaim).where(InsuranceClaim.id == claim_id))
    claim = result.scalar_one_or_none()
    if not claim:
        raise ValueError("Claim not found")
    if claim.status != ClaimStatus.DRAFT:
        raise ValueError(f"Cannot submit claim in status: {claim.status.value}")

    claim.status = ClaimStatus.SUBMITTED
    claim.submitted_at = datetime.utcnow()
    await db.flush()
    logger.info("Insurance claim submitted", claim_id=claim.id)
    return claim


async def process_bkash_refund(
    appointment: Appointment,
    amount: int,
    reason: str,
    db: AsyncSession,
) -> Dict:
    """Process a bKash refund for an appointment."""
    if not appointment.bkash_payment_id or not appointment.bkash_trx_id:
        raise ValueError("No bKash payment to refund")

    bkash_resp = await refund_payment(
        payment_id=appointment.bkash_payment_id,
        trx_id=appointment.bkash_trx_id,
        amount=amount,
        reason=reason,
    )

    if bkash_resp.get("statusCode") == "0000":
        appointment.payment_status = PaymentStatus.REFUNDED
        await db.flush()
        logger.info("bKash refund processed", trx_id=appointment.bkash_trx_id, amount=amount)
    else:
        logger.error("bKash refund failed", response=bkash_resp)

    return bkash_resp


async def get_payment_history(
    clinic_id: str,
    db: AsyncSession,
    days: int = 30,
    status: Optional[PaymentStatus] = None,
) -> List[Dict]:
    """Get payment history with patient details."""
    since = datetime.utcnow() - timedelta(days=days)

    query = select(Appointment).where(
        Appointment.clinic_id == clinic_id,
        Appointment.scheduled_at >= since,
    )
    if status:
        query = query.where(Appointment.payment_status == status)

    query = query.order_by(Appointment.scheduled_at.desc())
    result = await db.execute(query)
    appointments = result.scalars().all()

    history = []
    for appt in appointments:
        patient = await db.get(Patient, appt.patient_id)
        history.append({
            "appointment_id": appt.id,
            "scheduled_at": appt.scheduled_at.isoformat(),
            "patient_name": patient.name if patient else "Unknown",
            "patient_phone": patient.phone if patient else "",
            "consultation_fee": appt.consultation_fee,
            "advance_amount": appt.advance_amount,
            "payment_status": appt.payment_status.value,
            "bkash_trx_id": appt.bkash_trx_id,
        })

    return history
