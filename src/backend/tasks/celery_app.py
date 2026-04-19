from celery import Celery
from celery.schedules import crontab

from core.config import settings

celery_app = Celery(
    "pingly",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["tasks.ping"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "ping-all-monitors-every-minute": {
            "task": "tasks.ping.ping_all_monitors",
            "schedule": crontab(minute="*"),
        },
    },
)
