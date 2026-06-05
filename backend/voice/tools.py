"""
voice/tools.py — Gemini function-calling tool definitions for the voice agent.
These tools are what Gemini can "call" during a conversation.
Actual execution happens in voice/agent.py via tool_executor.
"""
from datetime import date

# ── Tool schemas (Gemini function declarations) ────────────────────────────────
TOOL_DECLARATIONS = [
    {
        "name": "check_available_slots",
        "description": (
            "Check available appointment slots for a doctor on a given date. "
            "Call this when the patient asks about availability."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "doctor_id": {
                    "type": "string",
                    "description": "The doctor's ID (use 'any' if patient has no preference)"
                },
                "date": {
                    "type": "string",
                    "description": "Date in YYYY-MM-DD format. Use today's date if not specified."
                },
                "specialty": {
                    "type": "string",
                    "description": "Medical specialty if patient didn't specify a doctor (e.g., 'medicine', 'gynecology')"
                }
            },
            "required": ["date"]
        }
    },
    {
        "name": "book_appointment",
        "description": (
            "Book a medical appointment for a patient after they have confirmed the slot. "
            "Only call this after the patient has confirmed the date, time and doctor."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "patient_name": {
                    "type": "string",
                    "description": "Full name of the patient"
                },
                "patient_phone": {
                    "type": "string",
                    "description": "Patient's phone number (BD format: 01XXXXXXXXX)"
                },
                "doctor_id": {
                    "type": "string",
                    "description": "The selected doctor's ID"
                },
                "scheduled_at": {
                    "type": "string",
                    "description": "ISO 8601 datetime for the appointment, e.g. 2024-12-15T10:30:00"
                },
                "notes": {
                    "type": "string",
                    "description": "Any notes about the patient's reason for visit (optional)"
                }
            },
            "required": ["patient_name", "patient_phone", "doctor_id", "scheduled_at"]
        }
    },
    {
        "name": "send_confirmation_sms",
        "description": (
            "Send an SMS confirmation to the patient after a successful booking."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "phone": {
                    "type": "string",
                    "description": "Patient's phone number"
                },
                "appointment_id": {
                    "type": "string",
                    "description": "The appointment ID from book_appointment"
                },
                "language": {
                    "type": "string",
                    "enum": ["bn-BD", "en-US"],
                    "description": "Language for the SMS message"
                }
            },
            "required": ["phone", "appointment_id"]
        }
    },
    {
        "name": "cancel_appointment",
        "description": "Cancel an existing appointment at the patient's request.",
        "parameters": {
            "type": "object",
            "properties": {
                "appointment_id": {
                    "type": "string",
                    "description": "The appointment ID to cancel"
                },
                "reason": {
                    "type": "string",
                    "description": "Reason for cancellation (optional)"
                }
            },
            "required": ["appointment_id"]
        }
    },
    {
        "name": "get_clinic_info",
        "description": (
            "Retrieve clinic information such as address, hours, and doctors list. "
            "Use this to answer patient questions about the clinic."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "info_type": {
                    "type": "string",
                    "enum": ["address", "hours", "doctors", "fees", "all"],
                    "description": "What type of information to retrieve"
                }
            },
            "required": ["info_type"]
        }
    }
]


def get_today_str() -> str:
    return date.today().isoformat()
