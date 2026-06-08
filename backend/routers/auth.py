"""
routers/auth.py — Phone OTP authentication for clinic staff.
"""
import random
import string
import structlog
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.base import get_db
from models.user import User
from models.clinic import Clinic
from config import get_settings
from services.sms_service import send_sms

router = APIRouter()
logger = structlog.get_logger()
settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Schemas ───────────────────────────────────────────────────────────────────
class RequestOTPBody(BaseModel):
    phone: str          # BD format: 01XXXXXXXXX


class VerifyOTPBody(BaseModel):
    phone: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ── Helpers ───────────────────────────────────────────────────────────────────
def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=settings.otp_length))


def _create_jwt(user_id: str, clinic_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiry_hours)
    payload = {
        "sub": user_id,
        "clinic_id": clinic_id,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _verify_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


# ── Dependency: get current user from JWT ─────────────────────────────────────
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = _verify_jwt(credentials.credentials)
    result = await db.execute(select(User).where(User.id == payload["sub"], User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/request-otp")
async def request_otp(body: RequestOTPBody, db: AsyncSession = Depends(get_db)):
    """Send OTP to staff phone number."""
    result = await db.execute(select(User).where(User.phone == body.phone, User.is_active == True))
    user = result.scalar_one_or_none()

    if not user:
        # Don't reveal whether number exists — same response either way
        return {"message": "যদি এই নম্বরটি নিবন্ধিত হয়, OTP পাঠানো হবে।"}

    otp = _generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.otp_expiry_minutes)

    user.otp_hash = pwd_context.hash(otp)
    user.otp_expires_at = expires_at
    await db.flush()

    # Send OTP via SMS
    msg = f"আপনার OTP: {otp}\nমেয়াদ: {settings.otp_expiry_minutes} মিনিট\nকাউকে শেয়ার করবেন না।"
    sent = await send_sms(body.phone, msg)

    if not sent and settings.app_env == "development":
        logger.warning("SMS not configured — OTP for dev use", otp=otp, phone=body.phone[-4:])

    logger.info("OTP sent", phone=body.phone[-4:])
    return {"message": "OTP পাঠানো হয়েছে।"}


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(body: VerifyOTPBody, db: AsyncSession = Depends(get_db)):
    """Verify OTP and return JWT access token."""
    result = await db.execute(select(User).where(User.phone == body.phone, User.is_active == True))
    user = result.scalar_one_or_none()

    if not user or not user.otp_hash or not user.otp_expires_at:
        raise HTTPException(status_code=400, detail="অবৈধ অনুরোধ।")

    if datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP মেয়াদ শেষ। আবার চেষ্টা করুন।")

    if not pwd_context.verify(body.otp, user.otp_hash):
        raise HTTPException(status_code=400, detail="OTP সঠিক নয়।")

    # Clear OTP
    user.otp_hash = None
    user.otp_expires_at = None
    user.last_login = datetime.utcnow()
    await db.flush()

    token = _create_jwt(user.id, user.clinic_id, user.role.value)

    return TokenResponse(
        access_token=token,
        user={"id": user.id, "name": user.name, "phone": user.phone, "role": user.role.value, "clinic_id": user.clinic_id},
    )


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Return current user info."""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "phone": current_user.phone,
        "role": current_user.role.value,
        "clinic_id": current_user.clinic_id,
    }
