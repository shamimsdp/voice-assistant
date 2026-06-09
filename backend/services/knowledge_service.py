import structlog
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from models.knowledge import KnowledgeArticle

logger = structlog.get_logger()


async def create_article(
    clinic_id: str,
    title: str,
    content: str,
    db: AsyncSession,
    title_bn: Optional[str] = None,
    content_bn: Optional[str] = None,
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
    is_public: bool = False,
) -> KnowledgeArticle:
    article = KnowledgeArticle(
        clinic_id=clinic_id,
        title=title,
        title_bn=title_bn,
        content=content,
        content_bn=content_bn,
        category=category,
        tags=tags or [],
        is_public=is_public,
    )
    db.add(article)
    await db.flush()
    logger.info("Knowledge article created", article_id=article.id, category=category)
    return article


async def get_articles(
    clinic_id: str,
    db: AsyncSession,
    category: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict]:
    conditions = [
        KnowledgeArticle.clinic_id == clinic_id,
        KnowledgeArticle.is_active == True,
    ]
    if category:
        conditions.append(KnowledgeArticle.category == category)
    if q:
        like = f"%{q}%"
        conditions.append(
            or_(
                KnowledgeArticle.title.ilike(like),
                KnowledgeArticle.title_bn.ilike(like),
                KnowledgeArticle.content.ilike(like),
                KnowledgeArticle.content_bn.ilike(like),
                KnowledgeArticle.tags.astext.ilike(like),
            )
        )

    query = (
        select(KnowledgeArticle)
        .where(and_(*conditions))
        .order_by(KnowledgeArticle.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    articles = result.scalars().all()

    return [
        {
            "id": a.id,
            "title": a.title,
            "title_bn": a.title_bn,
            "content": a.content,
            "content_bn": a.content_bn,
            "category": a.category,
            "tags": a.tags,
            "is_public": a.is_public,
            "is_active": a.is_active,
            "created_at": a.created_at.isoformat(),
            "updated_at": a.updated_at.isoformat(),
        }
        for a in articles
    ]


async def get_article(
    article_id: str,
    clinic_id: str,
    db: AsyncSession,
) -> Optional[KnowledgeArticle]:
    result = await db.execute(
        select(KnowledgeArticle).where(
            KnowledgeArticle.id == article_id,
            KnowledgeArticle.clinic_id == clinic_id,
        )
    )
    return result.scalar_one_or_none()


async def update_article(
    article_id: str,
    clinic_id: str,
    db: AsyncSession,
    title: Optional[str] = None,
    title_bn: Optional[str] = None,
    content: Optional[str] = None,
    content_bn: Optional[str] = None,
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
    is_public: Optional[bool] = None,
    is_active: Optional[bool] = None,
) -> Optional[KnowledgeArticle]:
    article = await get_article(article_id, clinic_id, db)
    if not article:
        return None

    if title is not None:
        article.title = title
    if title_bn is not None:
        article.title_bn = title_bn
    if content is not None:
        article.content = content
    if content_bn is not None:
        article.content_bn = content_bn
    if category is not None:
        article.category = category
    if tags is not None:
        article.tags = tags
    if is_public is not None:
        article.is_public = is_public
    if is_active is not None:
        article.is_active = is_active
    article.updated_at = datetime.utcnow()

    await db.flush()
    return article


async def delete_article(
    article_id: str,
    clinic_id: str,
    db: AsyncSession,
) -> bool:
    article = await get_article(article_id, clinic_id, db)
    if not article:
        return False
    await db.delete(article)
    await db.flush()
    return True


async def get_categories(clinic_id: str, db: AsyncSession) -> List[str]:
    result = await db.execute(
        select(KnowledgeArticle.category)
        .where(
            KnowledgeArticle.clinic_id == clinic_id,
            KnowledgeArticle.is_active == True,
            KnowledgeArticle.category.isnot(None),
        )
        .distinct()
        .order_by(KnowledgeArticle.category)
    )
    return [row[0] for row in result.all() if row[0]]
