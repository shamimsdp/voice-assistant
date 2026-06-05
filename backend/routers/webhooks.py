"""
routers/webhooks.py — Twilio webhook endpoints.
Handles incoming calls and real-time audio WebSocket streaming.
"""
import json
import asyncio
import structlog
from fastapi import APIRouter, Request, Response, WebSocket, WebSocketDisconnect, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from db.base import get_db
from services.twilio_service import (
    incoming_call_twiml, validate_twilio_request, decode_twilio_audio, encode_audio_for_twilio
)
from voice.session import CallSession, save_session, load_session, delete_session
from voice.agent import VoiceAgent
from models.clinic import Clinic
from models.call_log import CallLog, CallStatus
from sqlalchemy import select

router = APIRouter()
logger = structlog.get_logger()


@router.post("/call/incoming/{clinic_id}")
async def incoming_call(
    clinic_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Twilio webhook — fires when a patient calls the clinic number.
    Returns TwiML to start a media stream.
    """
    form = await request.form()
    call_sid    = form.get("CallSid", "")
    caller_phone = form.get("From", "")

    logger.info("Incoming call", clinic_id=clinic_id, caller=caller_phone, sid=call_sid)

    # Fetch clinic info
    result = await db.execute(select(Clinic).where(Clinic.id == clinic_id, Clinic.is_active == True))
    clinic = result.scalar_one_or_none()

    if not clinic:
        return PlainTextResponse(
            '<?xml version="1.0"?><Response><Say language="bn-BD">ক্লিনিক পাওয়া যায়নি।</Say></Response>',
            media_type="text/xml",
        )

    # Log the call
    call_log = CallLog(
        clinic_id=clinic_id,
        twilio_call_sid=call_sid,
        caller_phone=caller_phone,
        direction="inbound",
        status=CallStatus.IN_PROGRESS,
    )
    db.add(call_log)
    await db.flush()

    # Return TwiML to open Media Stream WebSocket
    twiml = incoming_call_twiml(clinic_id)
    return PlainTextResponse(twiml, media_type="text/xml")


@router.websocket("/stream/{clinic_id}")
async def media_stream(
    websocket: WebSocket,
    clinic_id: str,
):
    """
    WebSocket endpoint — receives real-time audio from Twilio Media Streams.
    Processes each utterance through the VoiceAgent pipeline.
    """
    await websocket.accept()
    logger.info("WebSocket connected", clinic_id=clinic_id)

    call_sid: str | None = None
    session: CallSession | None = None
    audio_buffer = bytearray()

    # Import here to avoid circular imports
    from db.base import AsyncSessionLocal
    from models.clinic import Clinic
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        try:
            # Fetch clinic
            result = await db.execute(select(Clinic).where(Clinic.id == clinic_id))
            clinic = result.scalar_one_or_none()
            clinic_name = clinic.name if clinic else "ক্লিনিক"

            async for raw_msg in websocket.iter_text():
                msg = json.loads(raw_msg)
                event = msg.get("event")

                if event == "start":
                    call_sid = msg["start"]["callSid"]
                    session = CallSession(
                        call_sid=call_sid,
                        caller_phone=msg["start"].get("customParameters", {}).get("caller", "unknown"),
                        clinic_id=clinic_id,
                        clinic_name=clinic_name,
                    )
                    await save_session(session)
                    agent = VoiceAgent(session=session, db=db)

                    # Send greeting
                    greeting_audio = await agent.get_greeting()
                    await websocket.send_json({
                        "event": "media",
                        "streamSid": msg["start"]["streamSid"],
                        "media": {"payload": encode_audio_for_twilio(greeting_audio)},
                    })
                    logger.info("Greeting sent", call_sid=call_sid)

                elif event == "media":
                    # Buffer incoming audio chunks
                    payload = msg["media"]["payload"]
                    audio_buffer.extend(decode_twilio_audio(payload))

                    # Process every ~2 seconds of audio (16kB @ 8kHz mulaw)
                    if len(audio_buffer) >= 16000:
                        chunk = bytes(audio_buffer)
                        audio_buffer.clear()

                        response_audio = await agent.process_audio(chunk)
                        if response_audio:
                            await websocket.send_json({
                                "event": "media",
                                "streamSid": msg.get("streamSid", ""),
                                "media": {"payload": encode_audio_for_twilio(response_audio)},
                            })

                elif event == "stop":
                    logger.info("Call ended", call_sid=call_sid)
                    if session:
                        await delete_session(call_sid)
                    break

        except WebSocketDisconnect:
            logger.info("WebSocket disconnected", call_sid=call_sid)
        except Exception as exc:
            logger.error("WebSocket error", error=str(exc), call_sid=call_sid)
        finally:
            # Update call log
            if call_sid:
                result = await db.execute(
                    select(CallLog).where(CallLog.twilio_call_sid == call_sid)
                )
                call_log = result.scalar_one_or_none()
                if call_log:
                    from datetime import datetime
                    call_log.status = CallStatus.COMPLETED
                    call_log.ended_at = datetime.utcnow()
                    if session:
                        import json as _json
                        call_log.transcript = _json.dumps(
                            session.conversation_history, ensure_ascii=False
                        )
                        call_log.detected_language = session.language
                        call_log.appointment_booked = bool(session.appointment_id)
                        call_log.appointment_id = session.appointment_id
                    await db.commit()
