"""
services/gemini_service.py — Gemini 2.0 Flash LLM integration
Handles multi-turn conversation with tool calling for the voice agent.
"""
import structlog
from typing import Dict, Optional
import google.generativeai as genai
from google.generativeai.types import GenerateContentResponse
from config import get_settings
from voice.prompts import build_system_prompt, NO_MEDICAL_ADVICE_BN, NO_MEDICAL_ADVICE_EN
from voice.tools import TOOL_DECLARATIONS

settings = get_settings()
logger = structlog.get_logger()

# Configure the Gemini client
genai.configure(api_key=settings.gemini_api_key)

# Safety settings — permissive for medical context (guardrails in system prompt)
SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT",        "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_HATE_SPEECH",       "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
]


def _build_model(system_prompt: str) -> genai.GenerativeModel:
    """Build a Gemini model instance with tools and system prompt."""
    tools = [genai.protos.Tool(
        function_declarations=[
            genai.protos.FunctionDeclaration(**tool)
            for tool in TOOL_DECLARATIONS
        ]
    )]

    return genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=system_prompt,
        tools=tools,
        safety_settings=SAFETY_SETTINGS,
        generation_config=genai.types.GenerationConfig(
            temperature=0.3,          # Low temp for consistent, factual responses
            max_output_tokens=512,    # Keep responses short for voice
            top_p=0.8,
        ),
    )


class GeminiConversation:
    """
    Manages a multi-turn Gemini conversation for a single call session.
    Handles tool call detection and response formatting for voice output.
    """

    def __init__(self, clinic_name: str, language: str = "bn-BD"):
        self.clinic_name = clinic_name
        self.language = language
        system_prompt = build_system_prompt(clinic_name, language)
        model = _build_model(system_prompt)
        self.chat = model.start_chat(history=[])
        self.pending_tool_calls: list[dict] = []

    async def send_message(self, user_text: str,
                          context: Optional[Dict] = None) -> tuple[str, list[dict]]:
        """
        Send a user message with optional enhancement context and get a response.

        Args:
            user_text: The patient's speech transcript
            context: Optional dict with sentiment, intent, dialect keys from voice enhancement

        Returns:
            (response_text, tool_calls)
            tool_calls is a list of {name, args} dicts if Gemini requested tools.
        """
        try:
            # If context is provided, prepend contextual instructions for the LLM
            if context:
                sentiment = context.get("sentiment", "neutral")
                intent = context.get("intent", "general_query")
                dialect = context.get("dialect", "standard_bangla")
                summary = context.get("conversation_summary", "")

                context_prefix = ""
                if sentiment == "negative":
                    context_prefix += "[Patient seems frustrated or unhappy. Respond with extra empathy and patience.] "
                elif sentiment == "urgent":
                    context_prefix += "[Patient sounds urgent. Prioritize quick resolution and avoid delay.] "
                elif sentiment == "positive":
                    context_prefix += "[Patient sounds satisfied. Maintain warm and appreciative tone.] "

                if intent != "general_query":
                    context_prefix += f"[Detected intent: {intent}. Guide conversation accordingly.] "

                if dialect != "standard_bangla":
                    context_prefix += f"[Patient may be using {dialect} dialect. Use simpler, clear Bangla.] "

                if summary:
                    context_prefix += f"[Context: {summary}] "

                if context_prefix:
                    enriched_text = context_prefix + user_text
                    logger.info("Gemini sending message with context",
                               text=user_text[:80], context=context_prefix.strip())
                else:
                    enriched_text = user_text
            else:
                enriched_text = user_text

            response: GenerateContentResponse = await self.chat.send_message_async(enriched_text)

            tool_calls = []
            response_text = ""

            for part in response.parts:
                if hasattr(part, "function_call") and part.function_call:
                    fc = part.function_call
                    tool_calls.append({
                        "name": fc.name,
                        "args": dict(fc.args),
                    })
                    logger.info("Gemini tool call", tool=fc.name, args=dict(fc.args))
                elif hasattr(part, "text") and part.text:
                    response_text += part.text

            return response_text.strip(), tool_calls

        except Exception as exc:
            logger.error("Gemini error", error=str(exc))
            # Return a graceful fallback in the detected language
            fallback = NO_MEDICAL_ADVICE_BN if self.language == "bn-BD" else NO_MEDICAL_ADVICE_EN
            return fallback, []

    async def send_tool_result(self, tool_name: str, result: dict) -> tuple[str, list[dict]]:
        """
        Send a tool execution result back to Gemini and get the next response.
        """
        tool_response = genai.protos.Part(
            function_response=genai.protos.FunctionResponse(
                name=tool_name,
                response={"result": result},
            )
        )
        try:
            response = await self.chat.send_message_async(tool_response)
            tool_calls = []
            response_text = ""

            for part in response.parts:
                if hasattr(part, "function_call") and part.function_call:
                    fc = part.function_call
                    tool_calls.append({"name": fc.name, "args": dict(fc.args)})
                elif hasattr(part, "text") and part.text:
                    response_text += part.text

            return response_text.strip(), tool_calls

        except Exception as exc:
            logger.error("Gemini tool result error", error=str(exc))
            return "একটু সমস্যা হয়েছে। অনুগ্রহ করে আবার বলুন।", []

    def update_language(self, language: str) -> None:
        """Update detected language mid-conversation."""
        self.language = language
