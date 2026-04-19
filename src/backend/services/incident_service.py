import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.incident import Incident
from schemas.incident import IncidentResponse

logger = logging.getLogger(__name__)


async def list_incidents(
    db: AsyncSession,
    user_monitor_ids: list[uuid.UUID],
    monitor_id: uuid.UUID | None = None,
) -> list[IncidentResponse]:
    """
    Возвращает инциденты по мониторам пользователя.
    Опционально фильтрует по конкретному монитору.
    """
    query = select(Incident).where(Incident.monitor_id.in_(user_monitor_ids))
    if monitor_id is not None:
        query = query.where(Incident.monitor_id == monitor_id)
    query = query.order_by(Incident.started_at.desc())

    result = await db.execute(query)
    incidents = result.scalars().all()
    return [IncidentResponse.model_validate(i) for i in incidents]


async def open_incident(db: AsyncSession, monitor_id: uuid.UUID) -> Incident:
    incident = Incident(
        monitor_id=monitor_id,
        started_at=datetime.now(timezone.utc),
    )
    db.add(incident)
    await db.flush()
    await db.refresh(incident)
    logger.warning("Incident opened for monitor_id=%s", monitor_id)
    return incident


async def close_active_incident(
    db: AsyncSession, monitor_id: uuid.UUID
) -> Incident | None:
    result = await db.execute(
        select(Incident)
        .where(Incident.monitor_id == monitor_id, Incident.resolved_at.is_(None))
        .order_by(Incident.started_at.desc())
        .limit(1)
    )
    incident = result.scalar_one_or_none()
    if incident is not None:
        incident.resolved_at = datetime.now(timezone.utc)
        await db.flush()
        logger.info("Incident closed for monitor_id=%s", monitor_id)
    return incident


async def get_active_incident(
    db: AsyncSession, monitor_id: uuid.UUID
) -> Incident | None:
    result = await db.execute(
        select(Incident)
        .where(Incident.monitor_id == monitor_id, Incident.resolved_at.is_(None))
        .order_by(Incident.started_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()
