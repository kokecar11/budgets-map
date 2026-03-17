---
name: fastapi-module
description: >
  Creates a complete FastAPI module with all its files following the project's
  modular domain architecture. Use this skill when the user says:
  "create module X", "add a module for X", "I need a CRUD for X",
  "create the files for X", "new module X", or any variation requesting
  a new domain/entity in the FastAPI project.
  The skill creates all 7 module files, updates main.py and alembic/env.py.
license: Apache-2.0
metadata:
  author: kokecar11
  version: "1.0.0"
  scope: [root, api]
  auto_invoke:
    - "Creating router, model, service, repository, dependencies, schemas in api/src/<module>"
    - "Implementing routers, services, repository, dependencies"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

# FastAPI — Create New Module

When the user requests a new module, follow these steps in order.

## Step 1 — Gather information

Before creating any file, ask the user if not already specified:

1. **Module name** (e.g. `roles`, `products`, `invoices`) → singular snake_case
2. **Model fields** — name, type, nullable, ForeignKey if any
3. **Relationships** — does it belong to another module? (e.g. `user_id`, `account_id`)

If the user already provided enough context, do not ask — infer and create directly.

---

## Step 2 — Naming conventions

| Concept             | Convention                                      |
| ------------------- | ----------------------------------------------- |
| Module folder       | `src/<module>/` in singular snake_case          |
| Table name          | plural snake_case (`roles`, `products`)         |
| Model class         | PascalCase (`Role`, `Product`)                  |
| Schemas             | suffixes `Base`, `Create`, `Update`, `Response` |
| Repository instance | `<module>_repository = <Model>Repository(db)`   |
| Service instance    | `<Model>Service(<module>_repository)`           |
| Router prefix       | `/<modules>` in plural                          |

---

## Step 3 — Create all 7 files

Create all files inside `src/<module>/`.

### `__init__.py`

```python
# empty
```

---

### `models.py`

```python
from sqlalchemy import Column, String, Integer, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from src.core.database import Base
from src.core.mixins import TimestampMixin, PrimaryKeyMixin


class <Model>(PrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "<models>"

    # Add the fields specified by the user
    # Common type examples:
    # name = Column(String, nullable=False)
    # description = Column(String, nullable=True)
    # amount = Column(Numeric(10, 2), nullable=False)
    # is_active = Column(Boolean, default=True)
    # user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # user = relationship("User", back_populates="<models>")
```

---

### `schemas.py`

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class <Model>Base(BaseModel):
    # shared fields between Create and Response
    pass


class <Model>Create(<Model>Base):
    # required fields on creation
    pass


class <Model>Update(BaseModel):
    # all optional to support partial PATCH
    pass


class <Model>Response(<Model>Base):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
```

---

### `repository.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from src.<module>.models import <Model>
from src.<module>.schemas import <Model>Create, <Model>Update


class <Model>Repository:

    def __init__(self, db: AsyncSession):
        self.db = db  # session lives in the repository

    async def get_by_id(self, id: int) -> Optional[<Model>]:
        result = await self.db.execute(select(<Model>).where(<Model>.id == id))
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[<Model>]:
        result = await self.db.execute(select(<Model>).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, data: <Model>Create) -> <Model>:
        obj = <Model>(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: <Model>, data: <Model>Update) -> <Model>:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: <Model>) -> None:
        await self.db.delete(obj)
        await self.db.flush()
```

---

### `services.py`

```python
from fastapi import HTTPException, status
from src.<module>.repository import <Model>Repository
from src.<module>.schemas import <Model>Create, <Model>Update
from src.<module>.models import <Model>


class <Model>Service:

    def __init__(self, repository: <Model>Repository):
        self.repository = repository  # repository is injected

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[<Model>]:
        return await self.repository.get_all(skip=skip, limit=limit)

    async def get_or_404(self, id: int) -> <Model>:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="<Model> not found"
            )
        return obj

    async def create(self, data: <Model>Create) -> <Model>:
        return await self.repository.create(data)

    async def update(self, id: int, data: <Model>Update) -> <Model>:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: int) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)
```

---

### `dependencies.py`

```python
from app.dependencies import db_dependency
from src.<module>.repository import <Model>Repository
from src.<module>.services import <Model>Service


def get_<module>_service(db: db_dependency) -> <Model>Service:
    <module>_repository = <Model>Repository(db)  # repo receives the db
    return <Model>Service(<module>_repository)   # service receives the repo
```

---

### `router.py`

```python
from fastapi import APIRouter, Depends, status
from typing import List
from src.<module>.schemas import <Model>Create, <Model>Update, <Model>Response
from src.<module>.services import <Model>Service
from src.<module>.dependencies import get_<module>_service

router = APIRouter(prefix="/<modules>", tags=["<Models>"])


@router.get("/", response_model=List[<Model>Response])
async def list_<modules>(service: <Model>Service = Depends(get_<module>_service)):
    return await service.get_all()


@router.get("/{id}", response_model=<Model>Response)
async def get_<module>(id: int, service: <Model>Service = Depends(get_<module>_service)):
    return await service.get_or_404(id)


@router.post("/", response_model=<Model>Response, status_code=status.HTTP_201_CREATED)
async def create_<module>(data: <Model>Create, service: <Model>Service = Depends(get_<module>_service)):
    return await service.create(data)


@router.patch("/{id}", response_model=<Model>Response)
async def update_<module>(id: int, data: <Model>Update, service: <Model>Service = Depends(get_<module>_service)):
    return await service.update(id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_<module>(id: int, service: <Model>Service = Depends(get_<module>_service)):
    await service.delete(id)
```

---

## Step 4 — Update existing files

### Add model import in `alembic/env.py`

Find the models import block and add:

```python
from src.<module>.models import <Model>
```

### Register the router in `main.py`

Add the import and `include_router`:

```python
from src.<module>.router import router as <module>_router
app.include_router(<module>_router, prefix="/api/v1")
```

---

## Step 5 — Show summary to user

When done, display a summary like this:

```
✅ Module `<module>` created successfully:

📁 src/<module>/
   ├── __init__.py
   ├── models.py       → <Model> class, table "<models>"
   ├── schemas.py      → <Model>Create, <Model>Update, <Model>Response
   ├── repository.py   → <Model>Repository
   ├── services.py     → <Model>Service
   ├── dependencies.py → get_<module>_service()
   └── router.py       → GET/POST/PATCH/DELETE /<modules>

📝 Updated files:
   ├── main.py         → router registered
   └── alembic/env.py  → model imported

⚡ Next step:
   alembic revision --autogenerate -m "add_<models>_table"
   alembic upgrade head
```

---

## Common Mistakes to Avoid

- **Do not pass `db` to each repository method** — the session lives in `self.db` since `__init__`
- **Do not instantiate Repository or Service inside the router** — always via `Depends(get_<module>_service)`
- **Do not put business logic in the router** — only call the service
- **Do not access the DB directly in services** — always via `self.repository`
- **Do not forget `model_config = {"from_attributes": True}`** in `Response` schemas
- **Do not forget to import models in `alembic/env.py`** before generating migrations
