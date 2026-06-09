import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Optional

from db.base import get_db
from models.user import User
from models.clinic import Clinic
from models.website import ClinicWebsite
from routers.auth import get_current_user
from services.website_service import get_website, upsert_website, format_website_for_public

router = APIRouter()
logger = structlog.get_logger()


class WebsiteConfigBody(BaseModel):
    custom_domain: Optional[str] = None
    theme_color: str = "#10b981"
    hero_title: Optional[str] = None
    hero_title_bn: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_subtitle_bn: Optional[str] = None
    about_text: Optional[str] = None
    about_text_bn: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    address_bn: Optional[str] = None
    working_hours: Optional[Dict] = None
    services_heading: Optional[str] = None
    services_heading_bn: Optional[str] = None
    doctors_heading: Optional[str] = None
    doctors_heading_bn: Optional[str] = None
    show_doctors: bool = True
    show_services: bool = True
    show_appointment_button: bool = True
    footer_text: Optional[str] = None
    footer_text_bn: Optional[str] = None
    is_published: bool = False


@router.get("/website")
async def get_clinic_website(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = await get_website(clinic_id=current_user.clinic_id, db=db)
    if not site:
        return None
    return format_website_for_public(site)


@router.put("/website")
async def update_clinic_website(
    body: WebsiteConfigBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = await upsert_website(
        clinic_id=current_user.clinic_id,
        db=db,
        custom_domain=body.custom_domain,
        theme_color=body.theme_color,
        hero_title=body.hero_title,
        hero_title_bn=body.hero_title_bn,
        hero_subtitle=body.hero_subtitle,
        hero_subtitle_bn=body.hero_subtitle_bn,
        about_text=body.about_text,
        about_text_bn=body.about_text_bn,
        contact_phone=body.contact_phone,
        contact_email=body.contact_email,
        address=body.address,
        address_bn=body.address_bn,
        working_hours=body.working_hours,
        services_heading=body.services_heading,
        services_heading_bn=body.services_heading_bn,
        doctors_heading=body.doctors_heading,
        doctors_heading_bn=body.doctors_heading_bn,
        show_doctors=body.show_doctors,
        show_services=body.show_services,
        show_appointment_button=body.show_appointment_button,
        footer_text=body.footer_text,
        footer_text_bn=body.footer_text_bn,
        is_published=body.is_published,
    )
    return format_website_for_public(site)


@router.get("/website/public/{clinic_id}")
async def get_public_website(
    clinic_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ClinicWebsite).where(
            ClinicWebsite.clinic_id == clinic_id,
            ClinicWebsite.is_published == True,
        )
    )
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Website not found or not published")

    result = await db.execute(select(Clinic).where(Clinic.id == clinic_id))
    clinic = result.scalar_one_or_none()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    from services.website_service import format_website_for_public
    from sqlalchemy import select
    from models.doctor import Doctor

    data = format_website_for_public(site)
    data["clinic_name"] = clinic.name
    data["clinic_name_bn"] = clinic.name_bn

    if site.show_doctors:
        doc_result = await db.execute(
            select(Doctor).where(
                Doctor.clinic_id == clinic_id,
                Doctor.is_active == True,
            )
        )
        data["doctors"] = [
            {
                "id": d.id,
                "name": d.name,
                "name_bn": d.name_bn,
                "specialty": d.specialty,
                "qualification": d.qualification,
                "consultation_fee": d.consultation_fee,
            }
            for d in doc_result.scalars().all()
        ]

    if site.show_services:
        from models.agent import Service
        svc_result = await db.execute(
            select(Service).where(Service.clinic_id == clinic_id)
        )
        data["services"] = [
            {
                "id": s.id,
                "name": s.name,
                "name_bn": s.name_bn,
                "description": s.description,
                "category": s.category,
                "price": s.price,
                "duration_min": s.duration_min,
            }
            for s in svc_result.scalars().all()
        ]

    return data
