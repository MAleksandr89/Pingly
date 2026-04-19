import logging
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

from core.config import settings
from models.check import Check
from models.incident import Incident
from models.monitor import Monitor
from tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

# Синхронный движок для Celery (asyncpg → psycopg2)
_sync_url = settings.database_url.replace(
    "postgresql+asyncpg://", "postgresql+psycopg2://"
)
_sync_engine = create_engine(
    _sync_url,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)
SyncSession = sessionmaker(bind=_sync_engine, expire_on_commit=False)


def _send_telegram_alert(monitor_name: str, url: str, status: str) -> None:
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        return

    emoji = "🔴" if status == "down" else "🟢"
    text = (
        f"{emoji} <b>{monitor_name}</b> is <b>{status.upper()}</b>\n"
        f"URL: {url}\n"
        f"Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}"
    )
    try:
        response = httpx.post(
            f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage",
            json={"chat_id": settings.telegram_chat_id, "text": text, "parse_mode": "HTML"},
            timeout=10.0,
        )
        response.raise_for_status()
        logger.info("Telegram alert sent: monitor='%s' status=%s", monitor_name, status)
    except httpx.HTTPError as exc:
        logger.error("Failed to send Telegram alert: %s", exc)


@celery_app.task(name="tasks.ping.ping_all_monitors", bind=True, max_retries=0)
def ping_all_monitors(self) -> dict:  # type: ignore[override]
    now = datetime.now(timezone.utc)
    dispatched = 0

    with SyncSession() as db:
        monitors = (
            db.execute(select(Monitor).where(Monitor.is_active == True))  # noqa: E712
            .scalars()
            .all()
        )

        # Получаем последние чеки для всех мониторов одним запросом — без N+1
        monitor_ids = [m.id for m in monitors]
        subquery = (
            select(Check.monitor_id, func.max(Check.checked_at).label("last_checked_at"))
            .where(Check.monitor_id.in_(monitor_ids))
            .group_by(Check.monitor_id)
            .subquery()
        )
        last_checks_rows = db.execute(
            select(subquery.c.monitor_id, subquery.c.last_checked_at)
        ).all()
        last_check_map: dict = {row.monitor_id: row.last_checked_at for row in last_checks_rows}

        for monitor in monitors:
            last_checked_at = last_check_map.get(monitor.id)
            should_ping = last_checked_at is None or (
                now - last_checked_at >= timedelta(minutes=monitor.interval_minutes)
            )
            if should_ping:
                # Уникальный task_id гарантирует, что за один интервал
                # для одного монитора будет запущена только одна задача.
                # Celery отклонит задачу с уже существующим task_id.
                interval_bucket = int(now.timestamp() // (monitor.interval_minutes * 60))
                ping_monitor.apply_async(
                    args=[str(monitor.id)],
                    task_id=f"ping-{monitor.id}-{interval_bucket}",
                )
                dispatched += 1

    logger.info("ping_all_monitors: dispatched %d tasks", dispatched)
    return {"dispatched": dispatched}


@celery_app.task(name="tasks.ping.ping_monitor", bind=True, max_retries=2, default_retry_delay=5)
def ping_monitor(self, monitor_id: str) -> dict:  # type: ignore[override]
    with SyncSession.begin() as db:  # type: ignore[attr-defined]
        monitor: Monitor | None = db.execute(
            select(Monitor).where(Monitor.id == monitor_id)
        ).scalar_one_or_none()

        if monitor is None:
            logger.warning("ping_monitor: monitor %s not found", monitor_id)
            return {"status": "skipped", "reason": "not_found"}

        last_check: Check | None = db.execute(
            select(Check)
            .where(Check.monitor_id == monitor.id)
            .order_by(Check.checked_at.desc())
            .limit(1)
        ).scalar_one_or_none()

        previous_status: str | None = last_check.status if last_check else None

        new_status: str = "down"
        response_time_ms: int | None = None

        try:
            start = datetime.now(timezone.utc)
            response = httpx.get(monitor.url, timeout=10.0, follow_redirects=True)
            elapsed_ms = int((datetime.now(timezone.utc) - start).total_seconds() * 1000)
            response_time_ms = elapsed_ms
            new_status = "up" if 200 <= response.status_code < 400 else "down"
        except httpx.TimeoutException:
            logger.warning("Timeout pinging %s", monitor.url)
        except httpx.RequestError as exc:
            logger.warning("Request error pinging %s: %s", monitor.url, exc)

        db.add(Check(
            monitor_id=monitor.id,
            status=new_status,
            response_time_ms=response_time_ms,
            checked_at=datetime.now(timezone.utc),
        ))

        status_changed = previous_status is not None and previous_status != new_status
        first_check = previous_status is None

        if new_status == "down" and (status_changed or first_check):
            active_incident: Incident | None = db.execute(
                select(Incident)
                .where(
                    Incident.monitor_id == monitor.id,
                    Incident.resolved_at.is_(None),
                )
                .with_for_update()  # предотвращает race condition при параллельных воркерах
            ).scalar_one_or_none()

            if active_incident is None:
                db.add(Incident(
                    monitor_id=monitor.id,
                    started_at=datetime.now(timezone.utc),
                ))
                logger.warning("Incident opened: monitor='%s'", monitor.name)
                _send_telegram_alert(monitor.name, monitor.url, "down")

        elif new_status == "up" and status_changed:
            active_incident = db.execute(
                select(Incident)
                .where(
                    Incident.monitor_id == monitor.id,
                    Incident.resolved_at.is_(None),
                )
                .with_for_update()
            ).scalar_one_or_none()

            if active_incident is not None:
                active_incident.resolved_at = datetime.now(timezone.utc)
                logger.info("Incident resolved: monitor='%s'", monitor.name)
                _send_telegram_alert(monitor.name, monitor.url, "up")

    logger.debug("ping_monitor: id=%s status=%s rt=%s", monitor_id, new_status, response_time_ms)
    return {"status": new_status, "response_time_ms": response_time_ms}
