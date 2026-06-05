"""
services/voice_enhancements.py — Enhanced voice agent capabilities
Includes sentiment analysis, intent recognition, and Bangla dialect support
"""
import structlog
import re
from typing import Dict, List, Optional
from enum import Enum
from config import get_settings

settings = get_settings()
logger = structlog.get_logger()


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    URGENT = "urgent"


class MedicalIntent(str, Enum):
    BOOK_APPOINTMENT = "book_appointment"
    CHECK_SCHEDULE = "check_schedule"
    CANCEL_APPOINTMENT = "cancel_appointment"
    RESCHEDULE_APPOINTMENT = "reschedule_appointment"
    ASK_CLINIC_INFO = "ask_clinic_info"
    PAYMENT_INQUIRY = "payment_inquiry"
    EMERGENCY = "emergency"
    GENERAL_QUERY = "general_query"


class Dialect(str, Enum):
    STANDARD_BANGLA = "standard_bangla"
    SYLHETI = "sylheti"
    CHITTAGONGIAN = "chittagonian"
    RANGPURI = "rangpuri"


class VoiceEnhancementService:
    """Service for enhancing voice agent capabilities with NLP features"""

    def __init__(self):
        # Sentiment indicators (Bangla and English)
        self.positive_indicators = [
            "ভালো", "চমৎকার", "দারুণ", "সুন্দর", "ধন্যবাদ", "খুশি",
            "সন্তুষ্ট", "ঠিক আছে", "হ্যাঁ", "অসাধারণ", "চমকপ্রদ",
            "thank you", "good", "great", "excellent", "thanks",
            "appreciate", "wonderful", "perfect", "fine", "ok", "yes",
            "helpful", "happy", "pleased", "amazing",
        ]
        self.negative_indicators = [
            "খারাপ", "দুঃখিত", "সমস্যা", "বিরক্ত", "অসন্তুষ্ট",
            "কষ্ট", "ব্যথা", "ভুগছি", "মন খারাপ", "হতাশ",
            "পারছি না", "বাজে", "অপেক্ষা", "ক্ষুব্ধ",
            "bad", "poor", "terrible", "disappointed", "unhappy",
            "angry", "frustrated", "worst", "hate", "annoyed",
            "useless", "not good", "unacceptable", "furious",
        ]
        self.urgent_indicators = [
            "জরুরি", "দ্রুত", "এখনি", "অবিলম্বে", "বিপদ",
            "দুর্ঘটনা", "মারাত্মক", "সাংঘাতিক", "এখনই",
            "রক্ত", "বুক ব্যথা", "শ্বাস", "অজ্ঞান", "আঘাত",
            "urgent", "emergency", "immediately", "right now",
            "asap", "critical", "accident", "bleeding", "heart",
            "chest", "unconscious", "breathing", "hurt", "severe",
        ]

        # Intent recognition patterns
        self.intent_patterns = {
            MedicalIntent.BOOK_APPOINTMENT: [
                r"বুক করি", r"বুক কর", r"দেখতে চাই", r"দেখাব",
                r"ডাক্তার দেখাব", r"সময় নিন", r"সিরিয়াল",
                r"book.*appointment", r"schedule.*visit", r"fix.*appointment",
                r"make.*appointment", r"see.*doctor", r"need.*appointment",
                r"want.*to.*see", r"appointment.*book",
            ],
            MedicalIntent.CHECK_SCHEDULE: [
                r"কখন.*সময়", r"কখন.*পাব", r"সময়.*দেখ", r"ডাক্তার.*সময়",
                r"কবে.*পাব", r"কখন.*যাব", r"free.*time", r"available.*time",
                r"doctor.*available", r"what.*time", r"when.*doctor",
                r"schedule.*when", r"when.*available", r"slot.*check",
            ],
            MedicalIntent.CANCEL_APPOINTMENT: [
                r"বাতিল", r" cancel", r"cancel ", r"canceled", r"cancelled",
                r"don't.*want", r"not.*coming", r"না.*যাব", r"না.*করব",
                r"বাতিল.*কর", r"cancel.*appointment",
            ],
            MedicalIntent.RESCHEDULE_APPOINTMENT: [
                r"reschedule", r"date.*change", r"time.*change",
                r"different.*day", r"another.*time", r"postpone",
                r"সময়.*বদল", r"তারিখ.*বদল", r"পরে.*নিন", r"আগে.*নিন",
                r"পিছা", r"সময়.*পাল্টা", r"দিন.*বদল",
            ],
            MedicalIntent.ASK_CLINIC_INFO: [
                r"ঠিকানা", r"কোথায়", r"ফোন.*নম্বর", r"contact",
                r"address", r"location", r"where.*clinic", r"phone.*number",
                r"কিভাবে.*যাব", r"কাছের.*হাসপাতাল", r"সময়.*কত",
                r"working.*hour", r"open.*time", r"close.*time",
            ],
            MedicalIntent.PAYMENT_INQUIRY: [
                r"payment", r"paisa", r"taka", r"টাকা", r"bkash",
                r"বিকাশ", r"cost", r"fee", r"charge", r"price",
                r"মূল্য", r"কত.*দাম", r"ভাড়া", r"পেমেন্ট",
                r"কত.*লাগবে", r"কত.*টাকা",
            ],
            MedicalIntent.EMERGENCY: [
                r"emergency", r"জরুরি", r"দুর্ঘটনা", r"accident",
                r"heart.*attack", r"chest.*pain", r"bleeding",
                r"unconscious", r"মারা", r"রক্ত", r"বুক.*ব্যথা",
                r"প্রাণ.*নিয়ে", r"বিপদ", r"অজ্ঞান", r"খুব.*কষ্ট",
            ],
        }

        # Dialect-specific word mappings (phonetic/regional variations)
        self.dialect_indicators = {
            Dialect.SYLHETI: [
                "ব্যাটা", "মাইর", "হামার", "তোরে",
                "কিতা", "হুনি", "গেলি", "যাইদা", "কইদা",
            ],
            Dialect.CHITTAGONGIAN: [
                "হামি", "হুনি", "গরম", "যাইতাছি",
                "বুইলা", "চাইলাম", "চুল্লা", "হুনছো",
                "বাত্তি", "হালুয়া",
            ],
            Dialect.RANGPURI: [
                "হামরা", "তোহরা", "তোরা",
                "হুনা", "কওঁ", "যাওঁ", "খাওঁ",
                "বুলি", "নিদি", "কী করি",
            ],
        }

    def analyze_sentiment(self, text: str) -> Sentiment:
        """
        Analyze sentiment of patient speech
        Returns: Sentiment enum value
        """
        if not text:
            return Sentiment.NEUTRAL

        text_lower = text.lower()

        # Check for urgent indicators first (highest priority)
        for indicator in self.urgent_indicators:
            if indicator in text_lower:
                logger.info("Urgent sentiment detected", indicator=indicator)
                return Sentiment.URGENT

        # Count positive and negative indicators
        positive_count = sum(1 for indicator in self.positive_indicators
                           if indicator in text_lower)
        negative_count = sum(1 for indicator in self.negative_indicators
                           if indicator in text_lower)

        # Determine sentiment based on weighted counts
        score = positive_count - negative_count

        if score >= 2:
            logger.info("Positive sentiment detected",
                       positive_count=positive_count, negative_count=negative_count)
            return Sentiment.POSITIVE
        elif score <= -1:
            logger.info("Negative sentiment detected",
                       positive_count=positive_count, negative_count=negative_count)
            return Sentiment.NEGATIVE
        else:
            return Sentiment.NEUTRAL

    def detect_intent(self, text: str) -> MedicalIntent:
        """
        Detect medical intent from patient speech
        Returns: MedicalIntent enum value
        """
        if not text:
            return MedicalIntent.GENERAL_QUERY

        text_lower = text.lower()

        # Check each intent pattern
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text_lower, re.IGNORECASE):
                    logger.info("Intent detected", intent=intent.value, pattern=pattern)
                    return intent

        return MedicalIntent.GENERAL_QUERY

    def detect_dialect(self, text: str) -> Dialect:
        """
        Detect Bengali dialect from speech text
        Returns: Dialect enum value
        """
        if not text:
            return Dialect.STANDARD_BANGLA

        text_lower = text.lower()
        dialect_scores = {d: 0 for d in Dialect}

        # Score each dialect based on matching indicators
        for dialect, indicators in self.dialect_indicators.items():
            for indicator in indicators:
                if indicator in text_lower:
                    dialect_scores[dialect] += 1

        # Find dialect with highest score
        best_dialect = max(dialect_scores, key=dialect_scores.get)
        best_score = dialect_scores[best_dialect]

        if best_score > 0 and best_dialect != Dialect.STANDARD_BANGLA:
            logger.info("Dialect detected", dialect=best_dialect.value, score=best_score)
            return best_dialect

        return Dialect.STANDARD_BANGLA

    def enhance_conversation_context(self,
                                   text: str,
                                   current_sentiment: Optional[Sentiment] = None) -> Dict:
        """
        Enhance conversation context with multiple NLP analyses
        Returns: Dictionary with sentiment, intent, dialect, and suggestions
        """
        sentiment = self.analyze_sentiment(text) if current_sentiment is None else current_sentiment
        intent = self.detect_intent(text)
        dialect = self.detect_dialect(text)

        # Generate contextual suggestions based on analysis
        suggestions = self._generate_contextual_suggestions(sentiment, intent, dialect)

        result = {
            "sentiment": sentiment.value,
            "intent": intent.value,
            "dialect": dialect.value,
            "confidence": self._calculate_confidence(text, sentiment, intent),
            "suggestions": suggestions,
        }

        logger.info("Conversation context enhanced", **result)
        return result

    def _calculate_confidence(self, text: str, sentiment: Sentiment, intent: MedicalIntent) -> float:
        """Calculate confidence score for the analysis"""
        if not text:
            return 0.0

        # Base confidence on text length and keyword matches
        text_length_factor = min(len(text.split()) / 10.0, 1.0)

        # Boost confidence for clear intent matches
        intent_boost = 0.2 if intent != MedicalIntent.GENERAL_QUERY else 0.0

        # Boost confidence for strong sentiment signals
        sentiment_boost = 0.2 if sentiment in [Sentiment.POSITIVE, Sentiment.NEGATIVE, Sentiment.URGENT] else 0.0

        confidence = min(0.5 + text_length_factor * 0.3 + intent_boost + sentiment_boost, 1.0)
        return round(confidence, 2)

    def _generate_contextual_suggestions(self,
                                       sentiment: Sentiment,
                                       intent: MedicalIntent,
                                       dialect: Dialect) -> List[str]:
        """Generate actionable suggestions based on analysis"""
        suggestions = []

        # Sentiment-based suggestions
        if sentiment == Sentiment.NEGATIVE:
            suggestions.append("use_empathetic_tone")
            suggestions.append("offer_escalation_to_human")
        elif sentiment == Sentiment.POSITIVE:
            suggestions.append("maintain_positive_tone")
            suggestions.append("ask_for_feedback")
        elif sentiment == Sentiment.URGENT:
            suggestions.append("prioritize_quick_resolution")
            suggestions.append("consider_emergency_protocols")

        # Intent-based suggestions
        if intent == MedicalIntent.BOOK_APPOINTMENT:
            suggestions.append("guide_slot_selection")
            suggestions.append("collect_patient_info")
        elif intent == MedicalIntent.CHECK_SCHEDULE:
            suggestions.append("provide_schedule_info")
            suggestions.append("ask_preferred_time")
        elif intent == MedicalIntent.EMERGENCY:
            suggestions.append("activate_emergency_response")
            suggestions.append("direct_to_999_or_hospital")
        elif intent == MedicalIntent.CANCEL_APPOINTMENT:
            suggestions.append("confirm_cancellation")
            suggestions.append("offer_reschedule")
        elif intent == MedicalIntent.RESCHEDULE_APPOINTMENT:
            suggestions.append("show_available_slots")
            suggestions.append("find_new_time")
        elif intent == MedicalIntent.PAYMENT_INQUIRY:
            suggestions.append("explain_payment_options")
            suggestions.append("offer_bkash_details")
        elif intent == MedicalIntent.ASK_CLINIC_INFO:
            suggestions.append("provide_clinic_details")
            suggestions.append("ask_if_need_directions")

        # Dialect-based suggestions
        if dialect != Dialect.STANDARD_BANGLA:
            suggestions.append("use_simpler_vocabulary")
            suggestions.append("speak_slower")

        return suggestions
