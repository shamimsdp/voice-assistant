"""
routers/payments.py — bKash payment initiation and callback handling.
"""
import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.base import get_db
from models.appointment import Appointment, PaymentStatus
from services.bkash_service import create_payment, execute_payment, query_payment
from routers.auth import get_current_user
from models.user import User
from config import get_settings

router = APIRouter()
logger = structlog.get_logger()
settings = get_settings()


class InitiatePaymentBody(BaseModel):
    appointment_id: str
    amount: int   # BDT


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
            patient_phone=appt.patient_id,   # resolved to phone in service
            callback_url=callback_url,
        )

        if bkash_resp.get("statusCode") != "0000":
            raise HTTPException(status_code=400, detail=f"bKash error: {bkash_resp.get('statusMessage')}")

        # Save payment ID
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
    """
    bKash redirect callback after customer completes payment.
    Automatically executes payment if status is 'success'.
    """
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
    }
