import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.check import Check

logger = logging.getLogger(__name__)


async def create_check(
    db: AsyncSession,
    monitor_id: uuid.UUID,
    status: str,
    response_time_ms: int | None,
) -> Check:
    check = Check(
        monitor_id=monitor_id,
        status=status,
        response_time_ms=response_time_ms,
        checked_at=datetime.now(timezone.utc),
    )
    db.add(check)
    await db.flush()
    await db.refresh(check)
    logger.debug("Check created: monitor_id=%s status=%s", monitor_id, status)
    return check


async def get_last_check(db: AsyncSession, monitor_id: uuid.UUID) -> Check | None:
    result = await db.execute(
        select(Check)
        .where(Check.monitor_id == monitor_id)
        .order_by(Check.checked_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()
