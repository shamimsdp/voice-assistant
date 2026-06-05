"""
services/stt_service.py — Google Cloud Speech-to-Text (Bangla: bn-BD)
Handles streaming transcription of patient audio during calls.
"""
import structlog
from google.cloud import speech
from config import get_settings

settings = get_settings()
logger = structlog.get_logger()

# Initialise client once (thread-safe, reusable)
_client: speech.SpeechAsyncClient | None = None


def _get_client() -> speech.SpeechAsyncClient:
    global _client
    if _client is None:
        _client = speech.SpeechAsyncClient()
    return _client


def build_streaming_config(language_code: str | None = None) -> speech.StreamingRecognitionConfig:
    """
    Build the streaming recognition config for bn-BD (Bangla).
    Falls back to settings default if no language is provided.
    """
    lang = language_code or settings.stt_language_code

    recognition_config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.MULAW,
        sample_rate_hertz=8000,          # Twilio uses 8kHz mulaw
        language_code=lang,
        model=settings.stt_model,        # "latest_long" for phone calls
        alternative_language_codes=["en-US"],   # Banglish fallback
        enable_automatic_punctuation=True,
        use_enhanced=True,
        metadata=speech.RecognitionMetadata(
            interaction_type=speech.RecognitionMetadata.InteractionType.PHONE_CALL,
            microphone_distance=speech.RecognitionMetadata.MicrophoneDistance.NEARFIELD,
            original_media_type=speech.RecognitionMetadata.OriginalMediaType.AUDIO,
            recording_device_type=speech.RecognitionMetadata.RecordingDeviceType.PHONE_LINE,
        ),
    )

    return speech.StreamingRecognitionConfig(
        config=recognition_config,
        interim_results=False,   # Only return final results to reduce noise
        single_utterance=True,   # Stop after one utterance (per turn)
    )


async def transcribe_audio_chunk(
    audio_bytes: bytes,
    language_code: str | None = None,
) -> tuple[str, float, str]:
    """
    Transcribe a single audio chunk (non-streaming, for short utterances).

    Returns:
        (transcript, confidence, detected_language)
    """
    client = _get_client()
    lang = language_code or settings.stt_language_code

    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.MULAW,
        sample_rate_hertz=8000,
        language_code=lang,
        model=settings.stt_model,
        alternative_language_codes=["en-US"],
        enable_automatic_punctuation=True,
        use_enhanced=True,
    )

    audio = speech.RecognitionAudio(content=audio_bytes)

    try:
        response = await client.recognize(config=config, audio=audio)

        if not response.results:
            return "", 0.0, lang

        result = response.results[0]
        alternative = result.alternatives[0]
        detected_lang = result.language_code or lang

        logger.info(
            "STT transcription",
            transcript=alternative.transcript[:100],
            confidence=alternative.confidence,
            language=detected_lang,
        )
        return alternative.transcript, alternative.confidence, detected_lang

    except Exception as exc:
        logger.error("STT error", error=str(exc))
        return "", 0.0, lang


def detect_language_from_transcript(transcript: str) -> str:
    """
    Heuristic: if >60% characters are ASCII, assume English.
    Otherwise Bangla (bn-BD).
    """
    if not transcript:
        return "bn-BD"
    ascii_count = sum(1 for c in transcript if ord(c) < 128 and c.isalpha())
    total_alpha = sum(1 for c in transcript if c.isalpha())
    if total_alpha == 0:
        return "bn-BD"
    ratio = ascii_count / total_alpha
    return "en-US" if ratio > 0.6 else "bn-BD"
