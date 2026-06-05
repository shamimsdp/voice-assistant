"""
services/sms_service.py — SMS confirmations via Twilio SMS
with SSL Wireless (local BD) fallback.
All patient-facing messages are sent in Bangla by default.
"""
import structlog
from twilio.rest import Client as TwilioClient
from config import get_settings

settings = get_settings()
logger = structlog.get_logger()

_twilio_client: TwilioClient | None = None


def _get_twilio() -> TwilioClient:
    global _twilio_client
    if _twilio_client is None:
        _twilio_client = TwilioClient(
            settings.twilio_account_sid,
            settings.twilio_auth_token,
        )
    return _twilio_client


# ── SMS Templates ─────────────────────────────────────────────────────────────

SMS_TEMPLATES = {
    "bn-BD": {
        "confirmation": (
            "✅ অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে!\n"
            "👨‍⚕️ ডাক্তার: {doctor_name}\n"
            "📅 তারিখ: {date}\n"
            "🕐 সময়: {time}\n"
            "🏥 {clinic_name}\n"
            "আইডি: {appointment_id}"
        ),
        "reminder": (
            "⏰ অ্যাপয়েন্টমেন্ট রিমাইন্ডার\n"
            "আগামীকাল {time}-এ {doctor_name}-এর সাথে আপনার অ্যাপয়েন্টমেন্ট আছে।\n"
            "🏥 {clinic_name}"
        ),
        "cancellation": (
            "❌ আপনার অ্যাপয়েন্টমেন্ট বাতিল করা হয়েছে।\n"
            "নতুন অ্যাপয়েন্টমেন্ট বুক করতে কল করুন।\n"
            "🏥 {clinic_name}"
        ),
    },
    "en-US": {
        "confirmation": (
            "✅ Appointment Confirmed!\n"
            "👨‍⚕️ Doctor: {doctor_name}\n"
            "📅 Date: {date}\n"
            "🕐 Time: {time}\n"
            "🏥 {clinic_name}\n"
            "ID: {appointment_id}"
        ),
        "reminder": (
            "⏰ Appointment Reminder\n"
            "You have an appointment with {doctor_name} tomorrow at {time}.\n"
            "🏥 {clinic_name}"
        ),
        "cancellation": (
            "❌ Your appointment has been cancelled.\n"
            "Please call to rebook.\n"
            "🏥 {clinic_name}"
        ),
    }
}


async def send_sms(phone: str, message: str) -> bool:
    """Send an SMS via Twilio. Returns True on success."""
    # Ensure BD phone number format
    to_number = phone if phone.startswith("+") else f"+88{phone}"
    try:
        client = _get_twilio()
        msg = client.messages.create(
            body=message,
            from_=settings.twilio_phone_number,
            to=to_number,
        )
        logger.info("SMS sent", to=to_number, sid=msg.sid)
        return True
    except Exception as exc:
        logger.error("SMS send failed", to=to_number, error=str(exc))
        # Try SSL Wireless fallback
        return await _send_ssl_wireless(to_number, message)


async def _send_ssl_wireless(phone: str, message: str) -> bool:
    """Fallback: SSL Wireless BD SMS gateway."""
    if not settings.ssl_wireless_user:
        return False
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                settings.ssl_wireless_api_url,
                params={
                    "user": settings.ssl_wireless_user,
                    "pass": settings.ssl_wireless_pass,
                    "sid": settings.ssl_wireless_sid,
                    "sms": message,
                    "mobile": phone,
                    "msg_type": "TEXT",
                },
                timeout=10.0,
            )
            success = resp.status_code == 200
            logger.info("SSL Wireless SMS", phone=phone, success=success)
            return success
    except Exception as exc:
        logger.error("SSL Wireless failed", error=str(exc))
        return False


async def send_appointment_sms(
    phone: str,
    appointment_id: str,
    language: str = "bn-BD",
    db=None,
) -> bool:
    """Send appointment confirmation SMS, fetching details from DB."""
    if db is None:
        return False

    from sqlalchemy import select
    from models.appointment import Appointment
    from models.doctor import Doctor
    from models.clinic import Clinic

    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    appt = result.scalar_one_or_none()
    if not appt:
        return False

    doc_result  = await db.execute(select(Doctor).where(Doctor.id == appt.doctor_id))
    clinic_result = await db.execute(select(Clinic).where(Clinic.id == appt.clinic_id))
    doctor = doc_result.scalar_one_or_none()
    clinic = clinic_result.scalar_one_or_none()

    lang = language if language in SMS_TEMPLATES else "bn-BD"
    tmpl = SMS_TEMPLATES[lang]["confirmation"]

    message = tmpl.format(
        doctor_name=doctor.name_bn if (lang == "bn-BD" and doctor and doctor.name_bn) else (doctor.name if doctor else "ডাক্তার"),
        date=appt.scheduled_at.strftime("%d/%m/%Y"),
        time=appt.scheduled_at.strftime("%I:%M %p"),
        clinic_name=clinic.name_bn if (lang == "bn-BD" and clinic and clinic.name_bn) else (clinic.name if clinic else ""),
        appointment_id=appointment_id[:8].upper(),
    )

    sent = await send_sms(phone, message)

    # Mark SMS as sent in DB
    if sent and appt:
        appt.sms_sent = True
        await db.flush()

    return sent
