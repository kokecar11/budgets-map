#!/bin/sh
if [ "$SERVICE_TYPE" = "worker" ]; then
  exec celery -A src.celery_app worker --loglevel=info --concurrency=2
elif [ "$SERVICE_TYPE" = "beat" ]; then
  exec celery -A src.celery_app beat --loglevel=info
else
  alembic upgrade head
  exec uvicorn src.main:app --host 0.0.0.0 --port $PORT --workers 2
fi
