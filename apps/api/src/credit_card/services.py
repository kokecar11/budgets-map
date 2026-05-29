from fastapi import HTTPException, status
from src.credit_card.repository import (
    CreditCardRepository, CreditCardPeriodRepository,
    CreditCardTransactionRepository, CreditCardPaymentRepository,
)
from src.credit_card.schemas import (
    CreditCardCreate, CreditCardUpdate,
    CreditCardPeriodCreate, CreditCardPeriodUpdate,
    CreditCardTransactionCreate, CreditCardTransactionUpdate,
    CreditCardPaymentCreate, CreditCardPaymentUpdate,
)
from src.credit_card.models import (
    CreditCardModel, CreditCardPeriodModel,
    CreditCardTransactionModel, CreditCardPaymentModel,
)
from src.transaction.repository import TransactionRepository
from src.transaction.schemas import TransactionCreate, TransactionUpdate


class CreditCardService:

    def __init__(self, repository: CreditCardRepository):
        self.repository = repository

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[CreditCardModel]:
        return await self.repository.get_all(skip=skip, limit=limit)

    async def get_by_user(self, user_id: str) -> list[CreditCardModel]:
        return await self.repository.get_by_user(user_id)

    async def get_or_404(self, id: str) -> CreditCardModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit card not found")
        return obj

    async def create(self, data: CreditCardCreate) -> CreditCardModel:
        return await self.repository.create(data)

    async def update(self, id: str, data: CreditCardUpdate) -> CreditCardModel:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)


class CreditCardPeriodService:

    def __init__(self, repository: CreditCardPeriodRepository):
        self.repository = repository

    async def get_by_credit_card(self, credit_card_id: str) -> list[CreditCardPeriodModel]:
        return await self.repository.get_by_credit_card(credit_card_id)

    async def get_or_404(self, id: str) -> CreditCardPeriodModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit card period not found")
        return obj

    async def create(self, data: CreditCardPeriodCreate) -> CreditCardPeriodModel:
        return await self.repository.create(data)

    async def update(self, id: str, data: CreditCardPeriodUpdate) -> CreditCardPeriodModel:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)


class CreditCardTransactionService:

    def __init__(
        self,
        repository: CreditCardTransactionRepository,
        transaction_repository: TransactionRepository,
    ):
        self.repository = repository
        self.transaction_repository = transaction_repository

    async def get_by_credit_card(self, credit_card_id: str) -> list[CreditCardTransactionModel]:
        return await self.repository.get_by_credit_card(credit_card_id)

    async def get_or_404(self, id: str) -> CreditCardTransactionModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit card transaction not found")
        return obj

    async def create(self, data: CreditCardTransactionCreate, user_id: str) -> CreditCardTransactionModel:
        obj = await self.repository.create(data)
        await self.transaction_repository.create(TransactionCreate(
            user_id=user_id,
            account_id=None,
            type="credit_card_charge",
            amount=data.amount,
            date=data.date,
            description=data.description,
            category_id=data.category_id,
            credit_card_transaction_id=obj.id,
        ))
        return obj

    async def update(self, id: str, data: CreditCardTransactionUpdate) -> CreditCardTransactionModel:
        obj = await self.get_or_404(id)
        updated = await self.repository.update(obj, data)
        sync_fields = {
            k: v for k, v in data.model_dump(exclude_unset=True).items()
            if k in {"amount", "description", "date", "category_id"}
        }
        if sync_fields:
            linked_tx = await self.transaction_repository.get_by_credit_card_transaction_id(updated.id)
            if linked_tx:
                await self.transaction_repository.update(linked_tx, TransactionUpdate(**sync_fields))
        return updated

    async def migrate_transactions(self, credit_card_id: str, user_id: str) -> int:
        charges = await self.repository.get_by_credit_card(credit_card_id)
        count = 0
        for charge in charges:
            linked = await self.transaction_repository.get_by_credit_card_transaction_id(charge.id)
            if not linked:
                await self.transaction_repository.create(TransactionCreate(
                    user_id=user_id,
                    account_id=None,
                    type="credit_card_charge",
                    amount=charge.amount,
                    date=charge.date,
                    description=charge.description,
                    category_id=charge.category_id,
                    credit_card_transaction_id=charge.id,
                ))
                count += 1
        return count

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)


class CreditCardPaymentService:

    def __init__(self, repository: CreditCardPaymentRepository):
        self.repository = repository

    async def get_by_credit_card(self, credit_card_id: str) -> list[CreditCardPaymentModel]:
        return await self.repository.get_by_credit_card(credit_card_id)

    async def get_or_404(self, id: str) -> CreditCardPaymentModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit card payment not found")
        return obj

    async def create(self, data: CreditCardPaymentCreate) -> CreditCardPaymentModel:
        return await self.repository.create(data)

    async def update(self, id: str, data: CreditCardPaymentUpdate) -> CreditCardPaymentModel:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)
