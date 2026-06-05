"""
services/twilio_service.py — Twilio call management helpers.
Generates TwiML for call flow and handles audio streaming.
"""
import base64
import structlog
from twilio.twiml.voice_response import VoiceResponse, Gather, Play, Stream, Connect
from twilio.request_validator import RequestValidator
from fastapi import Request, HTTPException
from config import get_settings

settings = get_settings()
logger = structlog.get_logger()


def validate_twilio_request(request: Request, body: bytes) -> bool:
    """Validate that a request genuinely comes from Twilio."""
    if settings.app_env == "development":
        return True   # Skip validation in dev

    validator = RequestValidator(settings.twilio_auth_token)
    signature = request.headers.get("X-Twilio-Signature", "")
    url = str(request.url)
    params = {}  # POST params parsed separately

    return validator.validate(url, params, signature)


def incoming_call_twiml(clinic_id: str) -> str:
    """
    TwiML response for an incoming call.
    Starts a Media Stream to the backend WebSocket for real-time processing.
    """
    response = VoiceResponse()

    # Connect to our WebSocket stream handler
    connect = Connect()
    stream = Stream(url=f"wss://{settings.webhook_base_url.replace('https://', '')}/webhooks/stream/{clinic_id}")
    stream.parameter(name="clinic_id", value=clinic_id)
    connect.append(stream)
    response.append(connect)

    return str(response)


def gather_speech_twiml(
    action_url: str,
    language: str = "bn-BD",
    timeout: int = 5,
    speech_timeout: str = "auto",
) -> str:
    """
    TwiML to gather speech input from the patient.
    Used in simple non-streaming mode.
    """
    response = VoiceResponse()

    gather = Gather(
        input="speech",
        action=action_url,
        method="POST",
        language=language,
        timeout=timeout,
        speech_timeout=speech_timeout,
        enhanced=True,
    )
    response.append(gather)

    # Fallback if no input
    response.say(
        "কোনো সাড়া পাওয়া যায়নি। ধন্যবাদ।"
        if language == "bn-BD"
        else "No response received. Goodbye.",
        language=language,
    )

    return str(response)


def play_audio_twiml(audio_url: str) -> str:
    """TwiML to play an audio file URL to the caller."""
    response = VoiceResponse()
    response.play(audio_url)
    return str(response)


def hangup_twiml(farewell_bn: str = "ধন্যবাদ। আবার কল করুন।") -> str:
    """TwiML to say goodbye and hang up."""
    response = VoiceResponse()
    response.say(farewell_bn, language="bn-BD", voice="Polly.Aditi")
    response.hangup()
    return str(response)


def encode_audio_for_twilio(audio_bytes: bytes) -> str:
    """Base64-encode audio bytes for sending over WebSocket to Twilio."""
    return base64.b64encode(audio_bytes).decode("utf-8")


def decode_twilio_audio(payload: str) -> bytes:
    """Decode base64 audio payload received from Twilio WebSocket."""
    return base64.b64decode(payload)
