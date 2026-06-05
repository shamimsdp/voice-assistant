"""
Tests for voice_enhancements.py — Sentiment analysis, intent recognition, and dialect detection
"""
from services.voice_enhancements import (
    VoiceEnhancementService,
    Sentiment,
    MedicalIntent,
    Dialect,
)

enhancer = VoiceEnhancementService()


class TestSentimentAnalysis:
    def test_neutral_empty_text(self):
        assert enhancer.analyze_sentiment("") == Sentiment.NEUTRAL
        assert enhancer.analyze_sentiment(None) == Sentiment.NEUTRAL

    def test_positive_sentiment_bangla(self):
        result = enhancer.analyze_sentiment("ভালো ধন্যবাদ আপনার জন্য")
        assert result == Sentiment.POSITIVE

    def test_positive_sentiment_english(self):
        result = enhancer.analyze_sentiment("thank you so much, that is great")
        assert result == Sentiment.POSITIVE

    def test_negative_sentiment_bangla(self):
        result = enhancer.analyze_sentiment("খুব খারাপ লাগছে আমার খুব কষ্ট হচ্ছে")
        assert result == Sentiment.NEGATIVE

    def test_negative_sentiment_english(self):
        result = enhancer.analyze_sentiment("this is terrible, I am very disappointed")
        assert result == Sentiment.NEGATIVE

    def test_urgent_sentiment(self):
        result = enhancer.analyze_sentiment("এটা জরুরি দ্রুত আমার বুক ব্যথা করছে")
        assert result == Sentiment.URGENT

    def test_urgent_english(self):
        result = enhancer.analyze_sentiment("this is an emergency, immediately help")
        assert result == Sentiment.URGENT

    def test_urgent_takes_priority(self):
        # Urgent indicators override positive/negative
        result = enhancer.analyze_sentiment("জরুরি কিন্তু ভালো লাগছে")
        assert result == Sentiment.URGENT

    def test_neutral_unknown_text(self):
        result = enhancer.analyze_sentiment("আমি কিছু বলতে চাই")
        assert result == Sentiment.NEUTRAL


class TestIntentRecognition:
    def test_book_appointment_bangla(self):
        result = enhancer.detect_intent("আমি অ্যাপয়েন্টমেন্ট বুক করি")
        assert result == MedicalIntent.BOOK_APPOINTMENT

    def test_book_appointment_english(self):
        result = enhancer.detect_intent("I want to book an appointment")
        assert result == MedicalIntent.BOOK_APPOINTMENT

    def test_check_schedule_bangla(self):
        result = enhancer.detect_intent("ডাক্তারের সময় কখন পাব")
        assert result == MedicalIntent.CHECK_SCHEDULE

    def test_check_schedule_english(self):
        result = enhancer.detect_intent("when is the doctor available")
        assert result == MedicalIntent.CHECK_SCHEDULE

    def test_cancel_appointment_bangla(self):
        result = enhancer.detect_intent("আমার অ্যাপয়েন্টমেন্ট বাতিল করুন")
        assert result == MedicalIntent.CANCEL_APPOINTMENT

    def test_cancel_appointment_english(self):
        result = enhancer.detect_intent("I want to cancel my appointment")
        assert result == MedicalIntent.CANCEL_APPOINTMENT

    def test_reschedule_appointment_bangla(self):
        result = enhancer.detect_intent("সময় বদল করতে চাই")
        assert result == MedicalIntent.RESCHEDULE_APPOINTMENT

    def test_reschedule_appointment_english(self):
        result = enhancer.detect_intent("can I reschedule to another day")
        assert result == MedicalIntent.RESCHEDULE_APPOINTMENT

    def test_emergency_bangla(self):
        result = enhancer.detect_intent("জরুরি বুক ব্যথা হচ্ছে")
        assert result == MedicalIntent.EMERGENCY

    def test_emergency_english(self):
        result = enhancer.detect_intent("heart attack emergency help")
        assert result == MedicalIntent.EMERGENCY

    def test_clinic_info_bangla(self):
        result = enhancer.detect_intent("আপনার ক্লিনিকের ঠিকানা কোথায়")
        assert result == MedicalIntent.ASK_CLINIC_INFO

    def test_payment_inquiry_english(self):
        result = enhancer.detect_intent("how much is the fee for bKash payment")
        assert result == MedicalIntent.PAYMENT_INQUIRY

    def test_general_query_fallback(self):
        result = enhancer.detect_intent("আজ আবহাওয়া কেমন")
        assert result == MedicalIntent.GENERAL_QUERY

    def test_empty_text(self):
        assert enhancer.detect_intent("") == MedicalIntent.GENERAL_QUERY
        assert enhancer.detect_intent(None) == MedicalIntent.GENERAL_QUERY


class TestDialectDetection:
    def test_standard_bangla(self):
        result = enhancer.detect_dialect("আমি আপনার সাথে কথা বলতে চাই")
        assert result == Dialect.STANDARD_BANGLA

    def test_empty_text(self):
        assert enhancer.detect_dialect("") == Dialect.STANDARD_BANGLA

    def test_standard_bangla_fallback(self):
        result = enhancer.detect_dialect("আমি ডাক্তার দেখতে চাই")
        assert result == Dialect.STANDARD_BANGLA


class TestEnhanceConversationContext:
    def test_full_enhancement_pipeline(self):
        result = enhancer.enhance_conversation_context("আমি অ্যাপয়েন্টমেন্ট বুক করতে চাই ধন্যবাদ")
        assert "sentiment" in result
        assert "intent" in result
        assert "dialect" in result
        assert "confidence" in result
        assert "suggestions" in result
        assert result["intent"] == MedicalIntent.BOOK_APPOINTMENT.value
        assert result["confidence"] > 0.5

    def test_empty_text_low_confidence(self):
        result = enhancer.enhance_conversation_context("")
        assert result["confidence"] == 0.0
        assert result["intent"] == MedicalIntent.GENERAL_QUERY.value

    def test_negative_sentiment_triggers_suggestions(self):
        result = enhancer.enhance_conversation_context("খুব খারাপ আমি অসন্তুষ্ট")
        assert "use_empathetic_tone" in result["suggestions"]
        assert "offer_escalation_to_human" in result["suggestions"]

    def test_urgent_sentiment_triggers_emergency_suggestions(self):
        result = enhancer.enhance_conversation_context("জরুরি দ্রুত সাহায্য দরকার")
        assert "prioritize_quick_resolution" in result["suggestions"]
        assert "consider_emergency_protocols" in result["suggestions"]

    def test_positive_sentiment_triggers_feedback_suggestion(self):
        result = enhancer.enhance_conversation_context("চমৎকার ভালো লাগছে ধন্যবাদ")
        assert "maintain_positive_tone" in result["suggestions"]
        assert "ask_for_feedback" in result["suggestions"]

    def test_book_appointment_suggestions(self):
        result = enhancer.enhance_conversation_context("আমি বুক করি অ্যাপয়েন্টমেন্ট")
        assert "guide_slot_selection" in result["suggestions"]
        assert "collect_patient_info" in result["suggestions"]

    def test_provided_sentiment_is_used(self):
        result = enhancer.enhance_conversation_context(
            "হ্যাঁ ঠিক আছে", current_sentiment=Sentiment.POSITIVE
        )
        assert result["sentiment"] == Sentiment.POSITIVE.value


class TestConfidenceCalculation:
    def test_longer_text_higher_confidence(self):
        short = enhancer._calculate_confidence("হ্যাঁ", Sentiment.NEUTRAL, MedicalIntent.GENERAL_QUERY)
        long = enhancer._calculate_confidence("আমি একটি অ্যাপয়েন্টমেন্ট বুক করতে চাই দয়া করে", Sentiment.NEUTRAL, MedicalIntent.BOOK_APPOINTMENT)
        assert long > short

    def test_detected_intent_boosts_confidence(self):
        no_intent = enhancer._calculate_confidence("হ্যাঁ", Sentiment.NEUTRAL, MedicalIntent.GENERAL_QUERY)
        with_intent = enhancer._calculate_confidence("হ্যাঁ", Sentiment.NEUTRAL, MedicalIntent.BOOK_APPOINTMENT)
        assert with_intent > no_intent
