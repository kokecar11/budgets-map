from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    "budgetsmap",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
    include=["src.tasks.recurring_transactions"],
)

celery_app.conf.beat_schedule = {
    "process-recurring-transactions": {
        "task": "src.tasks.recurring_transactions.process_recurring",
        "schedule": crontab(hour=0, minute=5),  # daily at 00:05 UTC
    },
}

celery_app.conf.timezone = "UTC"
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
