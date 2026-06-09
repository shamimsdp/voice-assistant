import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from db.base import get_db
from models.user import User
from routers.auth import get_current_user
from services.knowledge_service import (
    create_article,
    get_articles,
    get_article,
    update_article,
    delete_article,
    get_categories,
)

router = APIRouter()
logger = structlog.get_logger()


class CreateArticleBody(BaseModel):
    title: str
    content: str
    title_bn: Optional[str] = None
    content_bn: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: bool = False


class UpdateArticleBody(BaseModel):
    title: Optional[str] = None
    title_bn: Optional[str] = None
    content: Optional[str] = None
    content_bn: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None
    is_active: Optional[bool] = None


@router.get("/knowledge/categories")
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_categories(clinic_id=current_user.clinic_id, db=db)


@router.post("/knowledge")
async def create_article_endpoint(
    body: CreateArticleBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = await create_article(
        clinic_id=current_user.clinic_id,
        title=body.title,
        content=body.content,
        title_bn=body.title_bn,
        content_bn=body.content_bn,
        category=body.category,
        tags=body.tags,
        is_public=body.is_public,
        db=db,
    )
    return {
        "id": article.id,
        "title": article.title,
        "category": article.category,
        "created_at": article.created_at.isoformat(),
    }


@router.get("/knowledge")
async def list_articles(
    category: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_articles(
        clinic_id=current_user.clinic_id,
        db=db,
        category=category,
        q=q,
        limit=limit,
        offset=offset,
    )


@router.get("/knowledge/{article_id}")
async def get_article_endpoint(
    article_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = await get_article(article_id, clinic_id=current_user.clinic_id, db=db)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return {
        "id": article.id,
        "title": article.title,
        "title_bn": article.title_bn,
        "content": article.content,
        "content_bn": article.content_bn,
        "category": article.category,
        "tags": article.tags,
        "is_public": article.is_public,
        "is_active": article.is_active,
        "created_at": article.created_at.isoformat(),
        "updated_at": article.updated_at.isoformat(),
    }


@router.patch("/knowledge/{article_id}")
async def update_article_endpoint(
    article_id: str,
    body: UpdateArticleBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = await update_article(
        article_id=article_id,
        clinic_id=current_user.clinic_id,
        db=db,
        title=body.title,
        title_bn=body.title_bn,
        content=body.content,
        content_bn=body.content_bn,
        category=body.category,
        tags=body.tags,
        is_public=body.is_public,
        is_active=body.is_active,
    )
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return {
        "id": article.id,
        "title": article.title,
        "category": article.category,
        "is_active": article.is_active,
        "updated_at": article.updated_at.isoformat(),
    }


@router.delete("/knowledge/{article_id}")
async def delete_article_endpoint(
    article_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = await delete_article(article_id, clinic_id=current_user.clinic_id, db=db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"deleted": True}
