import structlog
from datetime import datetime
from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.website import ClinicWebsite

logger = structlog.get_logger()


async def get_website(
    clinic_id: str,
    db: AsyncSession,
) -> Optional[ClinicWebsite]:
    result = await db.execute(
        select(ClinicWebsite).where(ClinicWebsite.clinic_id == clinic_id)
    )
    return result.scalar_one_or_none()


async def upsert_website(
    clinic_id: str,
    db: AsyncSession,
    custom_domain: Optional[str] = None,
    theme_color: str = "#10b981",
    hero_title: Optional[str] = None,
    hero_title_bn: Optional[str] = None,
    hero_subtitle: Optional[str] = None,
    hero_subtitle_bn: Optional[str] = None,
    about_text: Optional[str] = None,
    about_text_bn: Optional[str] = None,
    contact_phone: Optional[str] = None,
    contact_email: Optional[str] = None,
    address: Optional[str] = None,
    address_bn: Optional[str] = None,
    working_hours: Optional[Dict] = None,
    services_heading: Optional[str] = None,
    services_heading_bn: Optional[str] = None,
    doctors_heading: Optional[str] = None,
    doctors_heading_bn: Optional[str] = None,
    show_doctors: bool = True,
    show_services: bool = True,
    show_appointment_button: bool = True,
    footer_text: Optional[str] = None,
    footer_text_bn: Optional[str] = None,
    is_published: bool = False,
) -> ClinicWebsite:
    existing = await get_website(clinic_id, db)
    if existing:
        for field, value in [
            ("custom_domain", custom_domain),
            ("theme_color", theme_color),
            ("hero_title", hero_title),
            ("hero_title_bn", hero_title_bn),
            ("hero_subtitle", hero_subtitle),
            ("hero_subtitle_bn", hero_subtitle_bn),
            ("about_text", about_text),
            ("about_text_bn", about_text_bn),
            ("contact_phone", contact_phone),
            ("contact_email", contact_email),
            ("address", address),
            ("address_bn", address_bn),
            ("working_hours", working_hours),
            ("services_heading", services_heading),
            ("services_heading_bn", services_heading_bn),
            ("doctors_heading", doctors_heading),
            ("doctors_heading_bn", doctors_heading_bn),
            ("show_doctors", show_doctors),
            ("show_services", show_services),
            ("show_appointment_button", show_appointment_button),
            ("footer_text", footer_text),
            ("footer_text_bn", footer_text_bn),
            ("is_published", is_published),
        ]:
            if value is not None:
                setattr(existing, field, value)
        existing.updated_at = datetime.utcnow()
        await db.flush()
        logger.info("Website config updated", clinic_id=clinic_id)
        return existing

    website = ClinicWebsite(
        clinic_id=clinic_id,
        custom_domain=custom_domain,
        theme_color=theme_color,
        hero_title=hero_title,
        hero_title_bn=hero_title_bn,
        hero_subtitle=hero_subtitle,
        hero_subtitle_bn=hero_subtitle_bn,
        about_text=about_text,
        about_text_bn=about_text_bn,
        contact_phone=contact_phone,
        contact_email=contact_email,
        address=address,
        address_bn=address_bn,
        working_hours=working_hours,
        services_heading=services_heading,
        services_heading_bn=services_heading_bn,
        doctors_heading=doctors_heading,
        doctors_heading_bn=doctors_heading_bn,
        show_doctors=show_doctors,
        show_services=show_services,
        show_appointment_button=show_appointment_button,
        footer_text=footer_text,
        footer_text_bn=footer_text_bn,
        is_published=is_published,
    )
    db.add(website)
    await db.flush()
    logger.info("Website config created", clinic_id=clinic_id)
    return website


def format_website_for_public(site: ClinicWebsite) -> Dict:
    return {
        "id": site.id,
        "clinic_id": site.clinic_id,
        "theme_color": site.theme_color,
        "hero_title": site.hero_title,
        "hero_title_bn": site.hero_title_bn,
        "hero_subtitle": site.hero_subtitle,
        "hero_subtitle_bn": site.hero_subtitle_bn,
        "about_text": site.about_text,
        "about_text_bn": site.about_text_bn,
        "contact_phone": site.contact_phone,
        "contact_email": site.contact_email,
        "address": site.address,
        "address_bn": site.address_bn,
        "working_hours": site.working_hours,
        "services_heading": site.services_heading,
        "services_heading_bn": site.services_heading_bn,
        "doctors_heading": site.doctors_heading,
        "doctors_heading_bn": site.doctors_heading_bn,
        "show_doctors": site.show_doctors,
        "show_services": site.show_services,
        "show_appointment_button": site.show_appointment_button,
        "footer_text": site.footer_text,
        "footer_text_bn": site.footer_text_bn,
        "is_published": site.is_published,
        "created_at": site.created_at.isoformat(),
        "updated_at": site.updated_at.isoformat(),
    }
