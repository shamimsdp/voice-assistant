"""
services/bkash_service.py — bKash payment gateway integration.
Uses the bKash Tokenized Checkout API.
Sandbox docs: https://developer.bka.sh/docs/tokenized-checkout-process
"""
import httpx
import structlog
from datetime import datetime
from config import get_settings

settings = get_settings()
logger = structlog.get_logger()

_access_token: str | None = None
_token_expires_at: datetime | None = None


async def _get_access_token() -> str:
    """Get or refresh the bKash access token."""
    global _access_token, _token_expires_at

    # Return cached token if still valid
    if _access_token and _token_expires_at and datetime.utcnow() < _token_expires_at:
        return _access_token

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.bkash_base_url}/token/grant",
            headers={
                "username": settings.bkash_username,
                "password": settings.bkash_password,
                "Content-Type": "application/json",
            },
            json={
                "app_key": settings.bkash_app_key,
                "app_secret": settings.bkash_app_secret,
            },
            timeout=15.0,
        )
        resp.raise_for_status()
        data = resp.json()

        _access_token = data["id_token"]
        # Tokens expire in ~1 hour; refresh 5 min early
        from datetime import timedelta
        _token_expires_at = datetime.utcnow() + timedelta(seconds=3300)

        logger.info("bKash token refreshed")
        return _access_token


def _headers(token: str) -> dict:
    return {
        "Authorization": token,
        "X-APP-Key": settings.bkash_app_key,
        "Content-Type": "application/json",
    }


async def create_payment(
    amount: int,
    appointment_id: str,
    patient_phone: str,
    callback_url: str,
) -> dict:
    """
    Initiate a bKash payment for an appointment deposit.

    Returns:
        {"bkashURL": "...", "paymentID": "...", "statusCode": "0000"}
    """
    token = await _get_access_token()

    payload = {
        "mode": "0011",
        "payerReference": patient_phone,
        "callbackURL": callback_url,
        "amount": str(amount),
        "currency": "BDT",
        "intent": "sale",
        "merchantInvoiceNumber": f"APPT-{appointment_id[:8].upper()}",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.bkash_base_url}/tokenized/checkout/create",
            headers=_headers(token),
            json=payload,
            timeout=15.0,
        )
        resp.raise_for_status()
        data = resp.json()
        logger.info("bKash payment created", payment_id=data.get("paymentID"), amount=amount)
        return data


async def execute_payment(payment_id: str) -> dict:
    """
    Execute a payment after the customer has authorised it on bKash.

    Returns:
        {"trxID": "...", "statusCode": "0000", "statusMessage": "Successful"}
    """
    token = await _get_access_token()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.bkash_base_url}/tokenized/checkout/execute",
            headers=_headers(token),
            json={"paymentID": payment_id},
            timeout=15.0,
        )
        resp.raise_for_status()
        data = resp.json()
        logger.info("bKash payment executed", trx_id=data.get("trxID"), status=data.get("statusCode"))
        return data


async def query_payment(payment_id: str) -> dict:
    """Query the current status of a payment."""
    token = await _get_access_token()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.bkash_base_url}/tokenized/checkout/payment/status",
            headers=_headers(token),
            json={"paymentID": payment_id},
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json()


async def refund_payment(payment_id: str, trx_id: str, amount: int, reason: str) -> dict:
    """Refund a bKash payment."""
    token = await _get_access_token()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.bkash_base_url}/tokenized/checkout/payment/refund",
            headers=_headers(token),
            json={
                "paymentID": payment_id,
                "trxID": trx_id,
                "amount": str(amount),
                "currency": "BDT",
                "reason": reason,
            },
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json()
