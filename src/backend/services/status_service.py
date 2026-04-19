import logging
import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.check import Check
from models.monitor import Monitor
from schemas.status import MonitorDayStatus, MonitorStatusResponse, StatusPageResponse

logger = logging.getLogger(__name__)

_HISTORY_DAYS = 90


def _build_history(day_had_down: dict[date, bool]) -> list[MonitorDayStatus]:
    today = datetime.now(timezone.utc).date()
    history: list[MonitorDayStatus] = []

    for offset in range(_HISTORY_DAYS - 1, -1, -1):
        day = today - timedelta(days=offset)
        if day not in day_had_down:
            day_status = None
        elif day_had_down[day]:
            day_status = "down"
        else:
            day_status = "up"
        history.append(MonitorDayStatus(date=day.isoformat(), status=day_status))

    return history


async def get_status_page(db: AsyncSession) -> StatusPageResponse:
    monitors_result = await db.execute(
        select(Monitor)
        .where(Monitor.is_active == True)  # noqa: E712
        .order_by(Monitor.created_at)
    )
    monitors = monitors_result.scalars().all()

    if not monitors:
        return StatusPageResponse(monitors=[])

    monitor_ids = [m.id for m in monitors]
    cutoff = datetime.now(timezone.utc) - timedelta(days=_HISTORY_DAYS)

    # Агрегируем на уровне БД: одна строка на (monitor_id, day)
    agg_result = await db.execute(
        select(
            Check.monitor_id,
            func.date(Check.checked_at).label("day"),
            func.bool_or(Check.status == "down").label("had_down"),
        )
        .where(Check.monitor_id.in_(monitor_ids), Check.checked_at >= cutoff)
        .group_by(Check.monitor_id, func.date(Check.checked_at))
    )
    agg_rows = agg_result.all()

    # Текущий статус: последний чек на монитор
    latest_subq = (
        select(
            Check.monitor_id,
            func.max(Check.checked_at).label("max_at"),
        )
        .where(Check.monitor_id.in_(monitor_ids))
        .group_by(Check.monitor_id)
        .subquery()
    )
    latest_result = await db.execute(
        select(Check.monitor_id, Check.status).join(
            latest_subq,
            (Check.monitor_id == latest_subq.c.monitor_id)
            & (Check.checked_at == latest_subq.c.max_at),
        )
    )
    current_status_by_monitor: dict[uuid.UUID, str] = {
        row.monitor_id: row.status for row in latest_result.all()
    }

    # {monitor_id: {date: had_down}}
    day_map_by_monitor: dict[uuid.UUID, dict[date, bool]] = defaultdict(dict)
    for row in agg_rows:
        day_map_by_monitor[row.monitor_id][row.day] = row.had_down

    monitor_statuses: list[MonitorStatusResponse] = []

    for monitor in monitors:
        mid = monitor.id
        day_had_down = day_map_by_monitor.get(mid, {})
        history = _build_history(day_had_down)

        # Uptime по дням (не по отдельным чекам)
        days_with_data = len(day_had_down)
        if days_with_data:
            days_up = sum(1 for had_down in day_had_down.values() if not had_down)
            uptime_pct = round(days_up / days_with_data * 100, 2)
        else:
            uptime_pct = None

        monitor_statuses.append(
            MonitorStatusResponse(
                id=str(mid),
                name=monitor.name,
                url=monitor.url,
                current_status=current_status_by_monitor.get(mid),
                uptime_percentage=uptime_pct,
                history=history,
            )
        )

    return StatusPageResponse(monitors=monitor_statuses)
