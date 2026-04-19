from typing import Literal

from pydantic import BaseModel, Field


class MonitorDayStatus(BaseModel):
    """Статус монитора за один день (для 90-дневной истории)."""

    date: str = Field(..., description="Дата в формате YYYY-MM-DD")
    status: Literal["up", "down"] | None = Field(
        default=None,
        description="Статус дня: up / down / null (нет данных)",
    )


class MonitorStatusResponse(BaseModel):
    """Публичный статус одного монитора."""

    id: str = Field(..., description="UUID монитора")
    name: str = Field(..., description="Название монитора")
    url: str = Field(..., description="Проверяемый URL")
    current_status: Literal["up", "down"] | None = Field(
        default=None, description="Текущий статус (null — ещё не проверялся)"
    )
    uptime_percentage: float | None = Field(
        default=None,
        description="Uptime за 90 дней в процентах (null — нет данных)",
    )
    history: list[MonitorDayStatus] = Field(
        default_factory=list,
        description="90-дневная история по дням (от -90 до сегодня)",
    )


class StatusPageResponse(BaseModel):
    """Полная публичная страница статуса."""

    monitors: list[MonitorStatusResponse] = Field(
        default_factory=list, description="Список мониторов с их статусами"
    )
