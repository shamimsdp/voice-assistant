"""
config.py — Pydantic settings loaded from .env
All configuration for the Bangladesh Medical Voice Assistant
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────────────
    app_env: str = "development"
    app_secret_key: str = "change-me"
    allowed_origins: str = "http://localhost:3000"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    # ── Google / Gemini ──────────────────────────────────────────────────
    gemini_api_key: str = ""
    google_cloud_project: str = ""
    google_application_credentials: str = "./gcp-service-account.json"

    # ── STT (Google Cloud Speech-to-Text) ────────────────────────────────
    stt_language_code: str = "bn-BD"
    stt_model: str = "latest_long"

    # ── TTS (Google Cloud Text-to-Speech) ────────────────────────────────
    tts_language_code: str = "bn-BD"
    tts_voice_name: str = "bn-BD-Standard-A"
    tts_speaking_rate: float = 0.95
    tts_pitch: float = 0.0

    # ── Twilio ───────────────────────────────────────────────────────────
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    twilio_whatsapp_from: str = "whatsapp:+14155238886"

    # ── Database ─────────────────────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/voice_assistant"
    database_pool_size: int = 10
    database_max_overflow: int = 20

    # ── Redis ────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"
    session_ttl_seconds: int = 3600

    # ── OTP / Auth ───────────────────────────────────────────────────────
    otp_expiry_minutes: int = 10
    otp_length: int = 6
    jwt_secret: str = "change-me-jwt"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 24

    # ── bKash ────────────────────────────────────────────────────────────
    bkash_base_url: str = "https://tokenized.sandbox.bka.sh/v1.2.0-beta"
    bkash_app_key: str = ""
    bkash_app_secret: str = ""
    bkash_username: str = ""
    bkash_password: str = ""

    # ── SMS Gateway ──────────────────────────────────────────────────────
    ssl_wireless_api_url: str = ""
    ssl_wireless_user: str = ""
    ssl_wireless_pass: str = ""
    ssl_wireless_sid: str = ""

    # ── Prayer Times ─────────────────────────────────────────────────────
    aladhan_api_url: str = "https://api.aladhan.com/v1"
    default_city: str = "Dhaka"
    default_country: str = "Bangladesh"

    # ── Server ───────────────────────────────────────────────────────────
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_url: str = "http://localhost:3000"
    webhook_base_url: str = "https://your-ngrok-or-domain.com"


@lru_cache
def get_settings() -> Settings:
    return Settings()
