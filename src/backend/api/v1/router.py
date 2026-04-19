from fastapi import APIRouter

from api.v1 import auth, incidents, monitors

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(monitors.router)
router.include_router(incidents.router)
