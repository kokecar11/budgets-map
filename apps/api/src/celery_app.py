import os
from celery import Celery
from celery.schedules import crontab

_redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "budgetsmap",
    broker=_redis_url,
    backend=_redis_url,
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
