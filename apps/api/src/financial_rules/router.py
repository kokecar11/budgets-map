from fastapi import APIRouter, Depends
from typing import Annotated

from src.auth.dependencies import get_current_user
from src.user.models import UserModel
from src.financial_rules.schemas import FinancialRulesResponse, FinancialRulesUpdate
from src.financial_rules.services import FinancialRulesService
from src.financial_rules.dependencies import get_financial_rules_service

router = APIRouter(prefix="/financial-rules", tags=["Financial Rules"])

CurrentUser = Annotated[UserModel, Depends(get_current_user)]


@router.get("", response_model=FinancialRulesResponse)
async def get_financial_rules(
    current_user: CurrentUser,
    service: FinancialRulesService = Depends(get_financial_rules_service),
):
    return await service.get_or_create(current_user.id)


@router.patch("", response_model=FinancialRulesResponse)
async def update_financial_rules(
    data: FinancialRulesUpdate,
    current_user: CurrentUser,
    service: FinancialRulesService = Depends(get_financial_rules_service),
):
    return await service.update(current_user.id, data)
