from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.settings import get_settings
from src.auth.router import router as auth_router
from src.permissions.router import router as permission_router
from src.user.router import router as user_router
from src.account.router import router as account_router
from src.category.router import router as category_router
from src.saving.router import router as saving_router
from src.budget.router import router as budget_router
from src.transaction.router import router as transaction_router
from src.credit_card.router import router as credit_card_router
from src.loan.router import router as loan_router
from src.subscription.router import router as subscription_router
from src.financial_rules.router import router as financial_rules_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    redirect_slashes=False,
)

origins = settings.ALLOWED_HOSTS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")
app.include_router(account_router, prefix="/api/v1")
app.include_router(category_router, prefix="/api/v1")
app.include_router(budget_router, prefix="/api/v1")
app.include_router(transaction_router, prefix="/api/v1")
app.include_router(saving_router, prefix="/api/v1")
app.include_router(credit_card_router, prefix="/api/v1")
app.include_router(loan_router, prefix="/api/v1")
app.include_router(permission_router, prefix="/api/v1")
app.include_router(subscription_router, prefix="/api/v1")
app.include_router(financial_rules_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
