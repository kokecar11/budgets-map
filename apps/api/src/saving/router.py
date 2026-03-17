from fastapi import APIRouter, Depends, status
from typing import Annotated, List

from src.auth.dependencies import get_current_user
from src.user.models import UserModel
from src.saving.schemas import SavingGoalCreate, SavingGoalUpdate, SavingGoalResponse
from src.saving.services import SavingGoalService
from src.saving.dependencies import get_saving_goal_service

router = APIRouter(prefix="/saving-goals", tags=["Saving Goals"])

CurrentUser = Annotated[UserModel, Depends(get_current_user)]


@router.get("/", response_model=List[SavingGoalResponse])
async def list_saving_goals(
    current_user: CurrentUser,
    service: SavingGoalService = Depends(get_saving_goal_service),
):
    return await service.get_by_user(current_user.id)


@router.get("/{id}", response_model=SavingGoalResponse)
async def get_saving_goal(
    id: str,
    _: CurrentUser,
    service: SavingGoalService = Depends(get_saving_goal_service),
):
    return await service.get_or_404(id)


@router.post("/", response_model=SavingGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_saving_goal(
    data: SavingGoalCreate,
    current_user: CurrentUser,
    service: SavingGoalService = Depends(get_saving_goal_service),
):
    data.user_id = current_user.id
    return await service.create(data)


@router.patch("/{id}", response_model=SavingGoalResponse)
async def update_saving_goal(
    id: str,
    data: SavingGoalUpdate,
    _: CurrentUser,
    service: SavingGoalService = Depends(get_saving_goal_service),
):
    return await service.update(id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saving_goal(
    id: str,
    _: CurrentUser,
    service: SavingGoalService = Depends(get_saving_goal_service),
):
    await service.delete(id)
