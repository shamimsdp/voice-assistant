---
name: backend-api
description: Creates or extends FastAPI backend endpoints for the Shasthya Seba AI clinic management system. Use when building API endpoints, models, services, or tests. Covers the full pattern: model -> service -> router -> tests -> registration.
---

# Backend API Development — Shasthya Seba AI

## Patterns

Every domain module follows the same 4-layer pattern:

```
models/{domain}.py          → SQLAlchemy ORM + enums
services/{domain}_service.py → Business logic (pure async functions)
routers/{domain}.py          → FastAPI endpoints (Pydantic bodies, auth, error handling)
tests/test_{domain}.py       → pytest tests
```

Then registered in:
- `backend/models/__init__.py` — Import and add to `__all__`
- `backend/db/base.py` — Add module import in `init_db()` import list
- `backend/main.py` — Import router and call `app.include_router()`

## Model Pattern

```python
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, Enum, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.base import Base
from datetime import datetime, date

class MyEnum(str, enum.Enum):
    VALUE_A = "value_a"
    VALUE_B = "value_b"

class MyModel(Base):
    __tablename__ = "my_models"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_bn: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[MyEnum] = mapped_column(Enum(MyEnum), default=MyEnum.VALUE_A)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

## Service Function Pattern

```python
async def my_function(clinic_id: str, db: AsyncSession, ...) -> dict:
    stmt = select(MyModel).where(
        MyModel.clinic_id == clinic_id,
        MyModel.is_active == True,
    )
    result = await db.execute(stmt)
    items = result.scalars().all()
    return {"total": len(items), "items": [{"id": i.id, "name": i.name} for i in items]}
```

## Router Pattern

```python
import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from db.base import get_db
from models.my_domain import MyModel, MyEnum
from models.user import User
from routers.auth import get_current_user

router = APIRouter()
logger = structlog.get_logger()

class CreateBody(BaseModel):
    name: str
    name_bn: Optional[str] = None

@router.get("/")
async def list_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await my_service_function(clinic_id=current_user.clinic_id, db=db)

@router.post("/", status_code=201)
async def create_item(
    body: CreateBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = MyModel(clinic_id=current_user.clinic_id, name=body.name)
    db.add(item)
    await db.flush()
    return {"id": item.id, "name": item.name}
```

## Registration Steps

1. In `backend/models/__init__.py`: `from .my_domain import MyModel, MyEnum`
2. In `backend/db/base.py`: Add `my_domain` to the `from models import ...` line
3. In `backend/main.py`:
   - `from routers.my_domain import router as my_domain_router`
   - `app.include_router(my_domain_router, prefix="/api/my-prefix", tags=["My Tag"])`

## Test Pattern

```python
from unittest.mock import Mock, AsyncMock
from models.my_domain import MyModel, MyEnum

class TestMyModel:
    def test_property(self):
        item = MyModel(name="Test", ...)
        assert item.some_property == expected_value

class TestMyService:
    def test_my_function(self):
        item = MyModel(id="item-1", ...)
        mock_db = AsyncMock()
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = [item]
        mock_db.execute = AsyncMock(return_value=mock_result)
        # call service function with mock_db
```

## Key Conventions

- All queries scoped to `current_user.clinic_id`
- Bangla fields: `name_bn`, `title_bn`, `description_bn` alongside English
- Enums as `str, enum.Enum` (StrEnum for Python 3.11+)
- Date fields: use Python `datetime.date`, parse from ISO strings
- JSON fields for flexible/optional nested data
- Log every mutation with `logger.info(...)`
- Raise `ValueError` in services, catch in routers as `HTTPException(404/400)`
