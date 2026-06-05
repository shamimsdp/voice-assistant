"""
voice/session.py — Call session state stored in Redis
Each active call has a session tracking conversation history, patient info, etc.
"""
import json
import uuid
from datetime import datetime
from typing import Optional
import redis.asyncio as aioredis
from config import get_settings

settings = get_settings()
_redis: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = await aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


class CallSession:
    """Represents the state of a single active voice call."""

    def __init__(
        self,
        call_sid: str,
        caller_phone: str,
        clinic_id: str,
        clinic_name: str,
    ):
        self.session_id: str = str(uuid.uuid4())
        self.call_sid: str = call_sid
        self.caller_phone: str = caller_phone
        self.clinic_id: str = clinic_id
        self.clinic_name: str = clinic_name
        self.language: str = "bn-BD"             # detected language
        self.patient_id: Optional[str] = None
        self.patient_name: Optional[str] = None
        self.appointment_id: Optional[str] = None
        self.conversation_history: list[dict] = []
        self.turn_count: int = 0
        self.started_at: str = datetime.utcnow().isoformat()
        self.last_enhancement: Optional[dict] = None  # Stores latest enhancement analysis
        self.conversation_summary: str = ""           # Compressed summary for long conversations
        self.enhancement_history: list[dict] = []     # Full enhancement history for analytics

    def add_turn(self, role: str, text: str, enhancement: Optional[dict] = None) -> None:
        """Add a conversation turn (user or assistant) with optional enhancement data."""
        turn = {
            "role": role,
            "text": text,
            "timestamp": datetime.utcnow().isoformat(),
        }
        if enhancement:
            turn["enhancement"] = enhancement
        self.conversation_history.append(turn)
        self.turn_count += 1

    def to_dict(self) -> dict:
        return self.__dict__

    @classmethod
    def from_dict(cls, data: dict) -> "CallSession":
        session = cls.__new__(cls)
        session.__dict__.update(data)
        return session

    def get_gemini_history(self) -> list[dict]:
        """Return conversation history in Gemini's expected format."""
        return [
            {"role": turn["role"], "parts": [{"text": turn["text"]}]}
            for turn in self.conversation_history
        ]


async def save_session(session: CallSession) -> None:
    r = await get_redis()
    key = f"call_session:{session.call_sid}"
    await r.setex(key, settings.session_ttl_seconds, json.dumps(session.to_dict()))


async def load_session(call_sid: str) -> Optional[CallSession]:
    r = await get_redis()
    key = f"call_session:{call_sid}"
    data = await r.get(key)
    if data:
        return CallSession.from_dict(json.loads(data))
    return None


async def delete_session(call_sid: str) -> None:
    r = await get_redis()
    await r.delete(f"call_session:{call_sid}")
