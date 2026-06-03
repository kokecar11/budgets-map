from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Annotated, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.user.models import UserModel
from src.transaction.schemas import (
    TransactionCreate, TransactionUpdate, TransactionResponse, TransactionPageResponse,
    MonthlyStatsResponse, CategoryStatsResponse,
    ReceiptScanRequest, ReceiptScanResponse,
)
from src.transaction.services import TransactionService
from src.transaction.dependencies import get_transaction_service, get_receipt_scan_service
from src.transaction.receipt_scan_service import ReceiptScanService, ReceiptScanError
from src.receipt_scan.repository import ReceiptScanUsageRepository
from src.category.repository import CategoryRepository
from src.core.database import get_db
from src.core.settings import get_settings, Settings

router = APIRouter(prefix="/transactions", tags=["Transactions"])

CurrentUser = Annotated[UserModel, Depends(get_current_user)]


@router.get("", response_model=List[TransactionResponse])
async def list_transactions(
    current_user: CurrentUser,
    service: TransactionService = Depends(get_transaction_service),
):
    return await service.get_by_user(current_user.id)


@router.get("/paged", response_model=TransactionPageResponse)
async def list_transactions_paged(
    current_user: CurrentUser,
    limit: int = Query(50, ge=1, le=200),
    next_token: Optional[str] = Query(None),
    service: TransactionService = Depends(get_transaction_service),
):
    return await service.list_paginated(current_user.id, limit=limit, next_token=next_token)


@router.get("/summary/monthly", response_model=MonthlyStatsResponse)
async def get_monthly_stats(
    current_user: CurrentUser,
    year: int = Query(None),
    service: TransactionService = Depends(get_transaction_service),
):
    from datetime import datetime
    y = year or datetime.now().year
    return await service.monthly_stats(current_user.id, y)


@router.get("/summary/categories", response_model=CategoryStatsResponse)
async def get_category_stats(
    current_user: CurrentUser,
    year: int = Query(None),
    month: Optional[int] = Query(None),
    service: TransactionService = Depends(get_transaction_service),
):
    from datetime import datetime
    y = year or datetime.now().year
    return await service.category_stats(current_user.id, y, month)


@router.get("/account/{account_id}", response_model=List[TransactionResponse])
async def list_transactions_by_account(
    account_id: str,
    _: CurrentUser,
    service: TransactionService = Depends(get_transaction_service),
):
    return await service.get_by_account(account_id)


@router.post("/scan-receipt", response_model=ReceiptScanResponse, tags=["Transactions"])
async def scan_receipt(
    body: ReceiptScanRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    service: ReceiptScanService = Depends(get_receipt_scan_service),
    settings: Settings = Depends(get_settings),
):
    """PRO-only endpoint: extract structured data from receipt OCR text using LLM.

    Flow:
    1. PRO gate — 403 if not pro.
    2. Atomic reserve — increment usage count; 429 if over cap (decrement back).
    3. Load user categories for prompt + anti-hallucination guard.
    4. Call OpenAI — on failure decrement and return 502.
    5. Return ReceiptScanResponse.
    """
    # 1. PRO gate
    if current_user.plan != "pro":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="PRO_REQUIRED")

    # 2. Atomic reserve
    period = datetime.now(timezone.utc).strftime("%Y-%m")
    usage_repo = ReceiptScanUsageRepository(db)
    new_count = await usage_repo.increment_and_get(current_user.id, period)

    if new_count > settings.RECEIPT_SCAN_MONTHLY_CAP:
        # Release the over-cap reservation and reject
        try:
            await usage_repo.decrement(current_user.id, period)
        except Exception:
            pass  # best-effort; don't mask the 429
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="SCAN_CAP_REACHED")

    # 3. Load user categories
    categories = await CategoryRepository(db).get_by_user(current_user.id)

    # 4. Build text from request body
    if body.text:
        text = body.text
    else:
        text = "\n".join(body.lines)

    # 5. Call LLM; on any transport failure release the reservation
    try:
        result = await service.scan_text(text, categories, currency=current_user.currency)
    except ReceiptScanError as exc:
        try:
            await usage_repo.decrement(current_user.id, period)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="SCAN_FAILED",
        ) from exc
    except Exception as exc:
        try:
            await usage_repo.decrement(current_user.id, period)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="SCAN_FAILED",
        ) from exc

    return result


@router.get("/{id}", response_model=TransactionResponse)
async def get_transaction(
    id: str,
    _: CurrentUser,
    service: TransactionService = Depends(get_transaction_service),
):
    return await service.get_or_404(id)


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: TransactionCreate,
    current_user: CurrentUser,
    service: TransactionService = Depends(get_transaction_service),
):
    if data.is_recurring:
        if current_user.plan != "pro" and await service.count_recurring(current_user.id) >= 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="RECURRING_LIMIT_REACHED",
            )
    data.user_id = current_user.id
    return await service.create(data)


@router.patch("/{id}", response_model=TransactionResponse)
async def update_transaction(
    id: str,
    data: TransactionUpdate,
    _: CurrentUser,
    service: TransactionService = Depends(get_transaction_service),
):
    return await service.update(id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    id: str,
    _: CurrentUser,
    service: TransactionService = Depends(get_transaction_service),
):
    await service.delete(id)
