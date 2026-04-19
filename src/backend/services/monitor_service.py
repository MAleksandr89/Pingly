import logging
import uuid
from http import HTTPStatus

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.monitor import Monitor
from models.user import User
from schemas.monitor import MonitorCreate, MonitorResponse, MonitorUpdate

logger = logging.getLogger(__name__)


async def get_user_monitor_ids(db: AsyncSession, user: User) -> list[uuid.UUID]:
    result = await db.execute(
        select(Monitor.id).where(Monitor.user_id == user.id)
    )
    return list(result.scalars().all())


async def list_monitors(db: AsyncSession, user: User) -> list[MonitorResponse]:
    result = await db.execute(
        select(Monitor)
        .where(Monitor.user_id == user.id)
        .order_by(Monitor.created_at.desc())
    )
    monitors = result.scalars().all()
    return [MonitorResponse.model_validate(m) for m in monitors]


async def create_monitor(
    db: AsyncSession, user: User, data: MonitorCreate
) -> MonitorResponse:
    monitor = Monitor(
        user_id=user.id,
        name=data.name,
        url=data.url,
        interval_minutes=data.interval_minutes,
        is_active=data.is_active,
    )
    db.add(monitor)
    await db.flush()
    await db.refresh(monitor)
    logger.info("Created monitor '%s' for user %s", monitor.name, user.email)
    return MonitorResponse.model_validate(monitor)


async def _get_monitor_for_user(
    db: AsyncSession, monitor_id: str, user: User
) -> Monitor:
    try:
        mid = uuid.UUID(monitor_id)
    except ValueError:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Монитор не найден")

    result = await db.execute(
        select(Monitor).where(Monitor.id == mid, Monitor.user_id == user.id)
    )
    monitor = result.scalar_one_or_none()
    if monitor is None:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Монитор не найден")
    return monitor


async def get_monitor(
    db: AsyncSession, monitor_id: str, user: User
) -> MonitorResponse:
    monitor = await _get_monitor_for_user(db, monitor_id, user)
    return MonitorResponse.model_validate(monitor)


async def update_monitor(
    db: AsyncSession, monitor_id: str, user: User, data: MonitorUpdate
) -> MonitorResponse:
    monitor = await _get_monitor_for_user(db, monitor_id, user)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(monitor, field, value)

    await db.flush()
    await db.refresh(monitor)
    logger.info("Updated monitor '%s' (id=%s)", monitor.name, monitor_id)
    return MonitorResponse.model_validate(monitor)


async def delete_monitor(
    db: AsyncSession, monitor_id: str, user: User
) -> None:
    monitor = await _get_monitor_for_user(db, monitor_id, user)
    await db.delete(monitor)
    logger.info("Deleted monitor id=%s for user %s", monitor_id, user.email)
