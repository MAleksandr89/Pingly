"""Pingly FastAPI application entry point."""
import logging
import time
from collections.abc import AsyncGenerator, Callable
from contextlib import asynccontextmanager
from http import HTTPStatus

from fastapi import Depends, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies.db import get_db
from api.dependencies.rate_limit import limiter
from api.v1.router import router as api_v1_router
from core.config import settings
from core.logger import configure_logging
from db.session import engine
from schemas.status import StatusPageResponse
from services.status_service import get_status_page

logger = logging.getLogger(__name__)

_SKIP_LOG_PATHS = {"/health"}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    configure_logging(settings.log_level)
    logger.info("Starting %s", settings.project_name)
    yield
    logger.info("Shutting down %s", settings.project_name)
    await engine.dispose()


app = FastAPI(
    title=settings.project_name,
    description="Self-hosted uptime monitoring with public status page",
    version="1.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
    redirect_slashes=False,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next: Callable) -> Response:
    if request.url.path in _SKIP_LOG_PATHS:
        return await call_next(request)

    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000

    status = response.status_code
    log_fn = logger.warning if status >= 400 else logger.info
    log_fn(
        "%s %s %d %.1fms",
        request.method,
        request.url.path,
        status,
        duration_ms,
    )
    return response


app.include_router(api_v1_router)


@app.get(
    "/health",
    status_code=HTTPStatus.OK,
    summary="Health check",
    description="Используется Docker для проверки работоспособности сервиса.",
    tags=["system"],
)
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get(
    "/api/status",
    response_model=StatusPageResponse,
    status_code=HTTPStatus.OK,
    summary="Публичная страница статуса",
    description=(
        "Возвращает текущий статус, uptime % за 90 дней и 90-дневную историю "
        "для всех активных мониторов. Аутентификация не требуется."
    ),
    tags=["status"],
)
async def status_page(db: AsyncSession = Depends(get_db)) -> StatusPageResponse:
    return await get_status_page(db)
