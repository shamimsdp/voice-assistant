"""
services/tts_service.py — Google Cloud Text-to-Speech (bn-BD Neural voice)
Synthesises Bangla/English text to audio for playback to patient.
"""
import structlog
from google.cloud import texttospeech
from config import get_settings

settings = get_settings()
logger = structlog.get_logger()

_client: texttospeech.TextToSpeechAsyncClient | None = None


def _get_client() -> texttospeech.TextToSpeechAsyncClient:
    global _client
    if _client is None:
        _client = texttospeech.TextToSpeechAsyncClient()
    return _client


# Voice map — bn-BD supports Standard voices; Neural2 where available
VOICE_MAP = {
    "bn-BD": {
        "name": "bn-BD-Standard-A",    # Female Bangla voice
        "gender": texttospeech.SsmlVoiceGender.FEMALE,
    },
    "en-US": {
        "name": "en-US-Neural2-F",     # Female English neural voice
        "gender": texttospeech.SsmlVoiceGender.FEMALE,
    },
}


async def synthesise_speech(
    text: str,
    language_code: str | None = None,
    audio_encoding: texttospeech.AudioEncoding = texttospeech.AudioEncoding.MULAW,
    sample_rate: int = 8000,
) -> bytes:
    """
    Convert text to speech audio bytes.

    Args:
        text:          The text to speak (Bangla or English)
        language_code: bn-BD or en-US
        audio_encoding: MULAW for Twilio (8kHz), MP3 for web playback
        sample_rate:   8000 for telephony, 22050 for web

    Returns:
        Raw audio bytes ready to stream to Twilio / client
    """
    client = _get_client()
    lang = language_code or settings.tts_language_code
    voice_cfg = VOICE_MAP.get(lang, VOICE_MAP["bn-BD"])

    synthesis_input = texttospeech.SynthesisInput(text=text)

    voice = texttospeech.VoiceSelectionParams(
        language_code=lang,
        name=voice_cfg["name"],
        ssml_gender=voice_cfg["gender"],
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=audio_encoding,
        sample_rate_hertz=sample_rate,
        speaking_rate=settings.tts_speaking_rate,
        pitch=settings.tts_pitch,
        effects_profile_id=["telephony-class-application"],
    )

    try:
        response = await client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config,
        )
        logger.info("TTS synthesised", chars=len(text), language=lang)
        return response.audio_content

    except Exception as exc:
        logger.error("TTS error", error=str(exc))
        raise


async def synthesise_for_twilio(text: str, language_code: str = "bn-BD") -> bytes:
    """Convenience wrapper — returns mulaw 8kHz audio for Twilio playback."""
    return await synthesise_speech(
        text=text,
        language_code=language_code,
        audio_encoding=texttospeech.AudioEncoding.MULAW,
        sample_rate=8000,
    )


async def synthesise_for_web(text: str, language_code: str = "bn-BD") -> bytes:
    """Convenience wrapper — returns MP3 for web dashboard playback."""
    return await synthesise_speech(
        text=text,
        language_code=language_code,
        audio_encoding=texttospeech.AudioEncoding.MP3,
        sample_rate=22050,
    )
