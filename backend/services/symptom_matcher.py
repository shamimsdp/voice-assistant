"""
services/symptom_matcher.py — Doctor specialization matching based on patient symptoms
Maps patient-reported symptoms to the most appropriate doctor
"""
import structlog
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.doctor import Doctor

logger = structlog.get_logger()

SYMPTOM_TO_SPECIALTY: Dict[str, List[str]] = {
    "fever": ["medicine", "general"],
    "cough": ["medicine", "chest", "general"],
    "cold": ["medicine", "ent", "general"],
    "sore throat": ["ent", "medicine"],
    "headache": ["neurology", "medicine", "general"],
    "stomach pain": ["gastroenterology", "medicine", "general"],
    "chest pain": ["cardiology", "medicine"],
    "back pain": ["orthopedics", "neurology", "medicine"],
    "joint pain": ["orthopedics", "rheumatology"],
    "skin rash": ["dermatology"],
    "eye problem": ["ophthalmology"],
    "ear pain": ["ent"],
    "pregnancy": ["gynecology", "obstetrics"],
    "menstrual": ["gynecology"],
    "urine infection": ["urology", "nephrology", "general"],
    "diabetes": ["endocrinology", "medicine"],
    "blood pressure": ["cardiology", "medicine"],
    "vaccination": ["pediatrics", "general"],
    "child fever": ["pediatrics"],
    "mental health": ["psychiatry", "neurology"],
    "breathing": ["chest", "cardiology", "medicine"],
    "weight loss": ["endocrinology", "nutrition", "general"],
    "allergy": ["immunology", "dermatology", "ent"],
    "dental": ["dental", "general"],
    "accident": ["orthopedics", "surgery", "emergency"],
}

SYMPTOM_TO_SPECIALTY_BN: Dict[str, List[str]] = {
    "জ্বর": ["medicine", "general"],
    "কাশি": ["medicine", "chest", "general"],
    "সর্দি": ["medicine", "ent", "general"],
    "গলা ব্যথা": ["ent", "medicine"],
    "মাথা ব্যথা": ["neurology", "medicine", "general"],
    "পেট ব্যথা": ["gastroenterology", "medicine", "general"],
    "বুক ব্যথা": ["cardiology", "medicine"],
    "পিঠ ব্যথা": ["orthopedics", "neurology", "medicine"],
    "গাঁটে ব্যথা": ["orthopedics", "rheumatology"],
    "চর্মরোগ": ["dermatology"],
    "চোখের সমস্যা": ["ophthalmology"],
    "কান ব্যথা": ["ent"],
    "গর্ভাবস্থা": ["gynecology", "obstetrics"],
    "মাসিক": ["gynecology"],
    "প্রস্রাবের সংক্রমণ": ["urology", "nephrology", "general"],
    "ডায়াবেটিস": ["endocrinology", "medicine"],
    "উচ্চ রক্তচাপ": ["cardiology", "medicine"],
    "টিকা": ["pediatrics", "general"],
    "শিশু জ্বর": ["pediatrics"],
    "মানসিক স্বাস্থ্য": ["psychiatry", "neurology"],
    "শ্বাসকষ্ট": ["chest", "cardiology", "medicine"],
    "ওজন কমানো": ["endocrinology", "nutrition", "general"],
    "এলার্জি": ["immunology", "dermatology", "ent"],
    "দাঁতের সমস্যা": ["dental", "general"],
    "দুর্ঘটনা": ["orthopedics", "surgery", "emergency"],
}


def _extract_symptoms(text: str) -> List[str]:
    """Extract symptom keywords from patient speech (Bangla/English)."""
    text_lower = text.lower()
    matched = []

    for symptom_en, _ in SYMPTOM_TO_SPECIALTY.items():
        if symptom_en in text_lower:
            matched.append(symptom_en)

    for symptom_bn, _ in SYMPTOM_TO_SPECIALTY_BN.items():
        if symptom_bn in text_lower:
            matched.append(symptom_bn)

    return matched


def _get_target_specialties(symptoms: List[str]) -> List[str]:
    """Derive target medical specialties from matched symptoms."""
    specialties = set()
    for symptom in symptoms:
        if symptom in SYMPTOM_TO_SPECIALTY:
            specialties.update(SYMPTOM_TO_SPECIALTY[symptom])
        if symptom in SYMPTOM_TO_SPECIALTY_BN:
            specialties.update(SYMPTOM_TO_SPECIALTY_BN[symptom])
    return list(specialties)


async def find_matching_doctors(
    text: str,
    clinic_id: str,
    db: AsyncSession,
    max_results: int = 3,
) -> List[Dict]:
    """
    Find best-matching doctors for a patient's symptom description.
    Returns doctors ranked by relevance score.
    """
    symptoms = _extract_symptoms(text)

    if not symptoms:
        logger.info("No symptoms detected, returning all active doctors")
        result = await db.execute(
            select(Doctor).where(
                Doctor.clinic_id == clinic_id,
                Doctor.is_active,
            )
        )
        doctors = result.scalars().all()
        return [
            {
                "id": d.id,
                "name": d.name,
                "name_bn": d.name_bn,
                "specialty": d.specialty,
                "specialty_bn": d.specialty_bn,
                "fee": d.consultation_fee,
                "score": 0.5,
            }
            for d in doctors[:max_results]
        ]

    target_specialties = _get_target_specialties(symptoms)
    logger.info("Matching doctors", symptoms=symptoms, target_specialties=target_specialties)

    result = await db.execute(
        select(Doctor).where(
            Doctor.clinic_id == clinic_id,
            Doctor.is_active,
        )
    )
    all_doctors = result.scalars().all()

    scored = []
    for doctor in all_doctors:
        score = 0.0
        doctor_specialty = (doctor.specialty or "").lower()

        for target in target_specialties:
            if target in doctor_specialty:
                score += 1.0

        if doctor.symptom_keywords:
            for kw in (doctor.symptom_keywords.get("en", []) + doctor.symptom_keywords.get("bn", [])):
                if kw.lower() in text.lower():
                    score += 0.5

        if score > 0:
            scored.append((doctor, score))

    scored.sort(key=lambda x: x[1], reverse=True)

    return [
        {
            "id": d.id,
            "name": d.name,
            "name_bn": d.name_bn,
            "specialty": d.specialty,
            "specialty_bn": d.specialty_bn,
            "fee": d.consultation_fee,
            "score": round(s, 2),
        }
        for d, s in scored[:max_results]
    ]
