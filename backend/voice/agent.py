"""
voice/agent.py — Core voice agent orchestrator.
Ties together STT → Gemini LLM → TTS and executes tool calls.
This is the "brain" of every phone call.
"""
import structlog
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession

from services.stt_service import transcribe_audio_chunk
from services.tts_service import synthesise_for_twilio
from services.gemini_service import GeminiConversation
from services.sms_service import send_appointment_sms
from services.voice_enhancements import VoiceEnhancementService
from voice.session import CallSession, save_session
from voice.prompts import EMERGENCY_RESPONSE_BN, EMERGENCY_RESPONSE_EN

logger = structlog.get_logger()

# Initialize voice enhancement service
voice_enhancer = VoiceEnhancementService()

# Keywords that signal a medical emergency — always respond with emergency msg
EMERGENCY_KEYWORDS = [
    "হার্ট অ্যাটাক", "বুকে ব্যথা", "শ্বাস নিতে পারছি না", "অজ্ঞান",
    "রক্ত পড়ছে", "দুর্ঘটনা", "heart attack", "chest pain", "can't breathe",
    "unconscious", "bleeding", "accident", "emergency",
]


def _is_emergency(text: str) -> bool:
    text_lower = text.lower()
    return any(kw.lower() in text_lower for kw in EMERGENCY_KEYWORDS)


class VoiceAgent:
    """
    Orchestrates a full voice call session.
    One VoiceAgent instance per active call.
    """

    def __init__(self, session: CallSession, db: AsyncSession):
        self.session = session
        self.db = db
        self.conversation = GeminiConversation(
            clinic_name=session.clinic_name,
            language=session.language,
        )
        # Initialize voice enhancement tracking
        self.enhancement_history: List[Dict] = []

    def _summarise_history(self) -> str:
        """Generate a compact summary of the conversation so far for long-running calls."""
        if not self.session.conversation_history:
            return ""

        summary_parts = []
        patient_info = []
        booking_info = None

        for turn in self.session.conversation_history:
            enh = turn.get("enhancement")

            if turn["role"] == "user" and enh:
                if enh.get("intent") == "book_appointment" and not booking_info:
                    booking_info = "patient wants to book"
                elif enh.get("intent") == "cancel_appointment":
                    booking_info = "patient wants to cancel"
                elif enh.get("intent") == "check_schedule":
                    patient_info.append("asked about schedule")

        if booking_info:
            summary_parts.append(booking_info)
        if self.session.patient_name:
            summary_parts.append(f"patient: {self.session.patient_name}")
        if self.session.appointment_id:
            summary_parts.append(f"appointment: {self.session.appointment_id}")

        result = "; ".join(summary_parts) if summary_parts else "ongoing conversation"
        return f"[Conversation summary: {result}]"

    def _update_conversation_summary(self) -> None:
        """Update the session's compressed summary for context retention."""
        summary = self._summarise_history()
        if summary:
            self.session.conversation_summary = summary
            logger.info("Conversation summary updated", summary=summary)

    async def process_audio(self, audio_bytes: bytes) -> bytes:
        """
        Full pipeline for one conversation turn:
        1. STT: audio → transcript
        2. Check for emergency keywords
        3. Enhance with sentiment/intent/dialect analysis
        4. LLM: transcript → response + tool calls
        5. Execute tool calls
        6. TTS: response text → audio bytes
        7. Save session state

        Returns: audio bytes to play back to patient
        """
        # ── Step 1: STT ───────────────────────────────────────────────────
        transcript, confidence, detected_lang = await transcribe_audio_chunk(
            audio_bytes, self.session.language
        )

        if not transcript:
            silence = await synthesise_for_twilio("", self.session.language)
            return silence

        logger.info("Patient said", transcript=transcript[:120], lang=detected_lang)

        # Update session language if changed
        if detected_lang != self.session.language:
            self.session.language = detected_lang
            self.conversation.update_language(detected_lang)

        # ── Step 1.5: Enhanced Analysis ───────────────────────────────────
        # Perform sentiment analysis, intent recognition, and dialect detection
        enhancement_result = voice_enhancer.enhance_conversation_context(transcript)
        self.enhancement_history.append({
            "turn": len(self.session.turns),
            "transcript": transcript[:100],
            **enhancement_result
        })

        # Log enhancement results for debugging
        logger.info("Voice enhancement analysis", **enhancement_result)

        # Store enhancement data in session for use in responses
        self.session.last_enhancement = enhancement_result
        self.session.enhancement_history.append({
            "turn": self.session.turn_count,
            **enhancement_result,
        })

        self.session.add_turn("user", transcript, enhancement=enhancement_result)

        # Generate conversation summary for long conversations (>10 exchanges)
        if self.session.turn_count >= 10 and self.session.turn_count % 5 == 0:
            self._update_conversation_summary()

        # ── Step 2: Emergency check ───────────────────────────────────────
        if _is_emergency(transcript):
            response_text = (
                EMERGENCY_RESPONSE_BN if self.session.language == "bn-BD"
                else EMERGENCY_RESPONSE_EN
            )
            self.session.add_turn("assistant", response_text)
            await save_session(self.session)
            return await synthesise_for_twilio(response_text, self.session.language)

        # ── Step 3: Gemini LLM (with enhancement context + summary) ──────
        gemini_context = dict(enhancement_result)
        if self.session.conversation_summary:
            gemini_context["conversation_summary"] = self.session.conversation_summary

        response_text, tool_calls = await self.conversation.send_message(
            transcript, context=gemini_context
        )

        # ── Step 4: Execute tool calls ────────────────────────────────────
        while tool_calls:
            for tool_call in tool_calls:
                tool_result = await self._execute_tool(tool_call)
                response_text, tool_calls = await self.conversation.send_tool_result(
                    tool_call["name"], tool_result
                )

        if not response_text:
            response_text = (
                "একটু সমস্যা হয়েছে। অনুগ্রহ করে আবার বলুন।"
                if self.session.language == "bn-BD"
                else "I'm sorry, I didn't catch that. Could you please repeat?"
            )

        logger.info("Agent response", response=response_text[:120])
        self.session.add_turn("assistant", response_text)
        await save_session(self.session)

        # ── Step 5: TTS ───────────────────────────────────────────────────
        audio_out = await synthesise_for_twilio(response_text, self.session.language)
        return audio_out

    async def _execute_tool(self, tool_call: dict) -> dict:
        """Route a Gemini tool call to the appropriate handler."""
        name = tool_call["name"]
        args = tool_call.get("args", {})

        logger.info("Executing tool", tool=name, args=args)

        try:
            if name == "check_available_slots":
                return await self._tool_check_slots(args)
            elif name == "book_appointment":
                return await self._tool_book_appointment(args)
            elif name == "send_confirmation_sms":
                return await self._tool_send_sms(args)
            elif name == "cancel_appointment":
                return await self._tool_cancel_appointment(args)
            elif name == "get_clinic_info":
                return await self._tool_get_clinic_info(args)
            else:
                return {"error": f"Unknown tool: {name}"}
        except Exception as exc:
            logger.error("Tool execution failed", tool=name, error=str(exc))
            return {"error": str(exc)}

    # ── Tool Implementations ─────────────────────────────────────────────

    async def _tool_check_slots(self, args: dict) -> dict:
        from sqlalchemy import select
        from models.doctor import Doctor
        from datetime import datetime

        target_date = args.get("date")
        doctor_id = args.get("doctor_id")
        specialty = args.get("specialty")

        # Query doctors at this clinic
        query = select(Doctor).where(
            Doctor.clinic_id == self.session.clinic_id,
            Doctor.is_active,
        )
        if doctor_id and doctor_id != "any":
            query = query.where(Doctor.id == doctor_id)
        if specialty:
            query = query.where(Doctor.specialty.ilike(f"%{specialty}%"))

        result = await self.db.execute(query)
        doctors = result.scalars().all()

        if not doctors:
            return {"slots": [], "message": "No doctors available"}

        # For each doctor, return their available slots for the date
        available = []
        for doc in doctors[:3]:  # Limit to 3 doctors for voice
            slots = doc.available_slots or {}
            day_name = datetime.strptime(target_date, "%Y-%m-%d").strftime("%a").lower()
            day_slots = slots.get(day_name, ["09:00", "10:00", "11:00", "15:00", "16:00"])

            available.append({
                "doctor_id": doc.id,
                "doctor_name": doc.name,
                "doctor_name_bn": doc.name_bn,
                "specialty": doc.specialty,
                "fee": doc.consultation_fee,
                "slots": day_slots[:5],  # First 5 slots for voice
            })

        return {"date": target_date, "doctors": available}

    async def _tool_book_appointment(self, args: dict) -> dict:
        from models.patient import Patient
        from models.appointment import Appointment
        from models.doctor import Doctor
        from sqlalchemy import select
        from datetime import datetime

        # Get or create patient
        phone = args["patient_phone"]
        result = await self.db.execute(
            select(Patient).where(Patient.phone == phone)
        )
        patient = result.scalar_one_or_none()

        if not patient:
            patient = Patient(
                phone=phone,
                name=args["patient_name"],
                preferred_language=self.session.language,
            )
            self.db.add(patient)
            await self.db.flush()

        # Get doctor fee
        doc_result = await self.db.execute(
            select(Doctor).where(Doctor.id == args["doctor_id"])
        )
        doctor = doc_result.scalar_one_or_none()
        fee = doctor.consultation_fee if doctor else 0

        # Create appointment
        appt = Appointment(
            clinic_id=self.session.clinic_id,
            doctor_id=args["doctor_id"],
            patient_id=patient.id,
            scheduled_at=datetime.fromisoformat(args["scheduled_at"]),
            notes=args.get("notes", ""),
            consultation_fee=fee,
        )
        self.db.add(appt)
        await self.db.flush()

        # Update session
        self.session.patient_id = patient.id
        self.session.patient_name = args["patient_name"]
        self.session.appointment_id = appt.id

        return {
            "success": True,
            "appointment_id": appt.id,
            "patient_name": args["patient_name"],
            "scheduled_at": args["scheduled_at"],
            "doctor": doctor.name if doctor else "ডাক্তার",
            "fee": fee,
        }

    async def _tool_send_sms(self, args: dict) -> dict:
        result = await send_appointment_sms(
            phone=args["phone"],
            appointment_id=args["appointment_id"],
            language=args.get("language", self.session.language),
            db=self.db,
        )
        return {"sent": result}

    async def _tool_cancel_appointment(self, args: dict) -> dict:
        from models.appointment import Appointment, AppointmentStatus
        from sqlalchemy import select

        result = await self.db.execute(
            select(Appointment).where(Appointment.id == args["appointment_id"])
        )
        appt = result.scalar_one_or_none()
        if appt:
            appt.status = AppointmentStatus.CANCELLED
            return {"success": True, "appointment_id": args["appointment_id"]}
        return {"success": False, "error": "Appointment not found"}

    async def _tool_get_clinic_info(self, args: dict) -> dict:
        from models.clinic import Clinic
        from sqlalchemy import select

        result = await self.db.execute(
            select(Clinic).where(Clinic.id == self.session.clinic_id)
        )
        clinic = result.scalar_one_or_none()
        if not clinic:
            return {"error": "Clinic not found"}

        info_type = args.get("info_type", "all")
        data: dict = {"clinic_name": clinic.name}

        if info_type in ("address", "all"):
            data["address"] = clinic.address
            data["address_bn"] = clinic.address_bn

        if info_type in ("hours", "all"):
            data["working_hours"] = clinic.working_hours

        if info_type in ("fees", "all"):
            data["note"] = "Fees vary by doctor. Please ask for a specific doctor's fee."

        return data

    async def get_greeting(self) -> bytes:
        """Generate the initial greeting audio for a new call."""
        greeting_bn = (
            f"আস্সালামু আলাইকুম! {self.session.clinic_name}-এ আপনাকে স্বাগতম। "
            "আমি আশা, আপনার রিসেপশনিস্ট। আপনার নাম এবং কীভাবে সাহায্য করতে পারি বলুন।"
        )
        return await synthesise_for_twilio(greeting_bn, "bn-BD")
