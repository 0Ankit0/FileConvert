from __future__ import annotations

from fastapi import APIRouter

from app.plugins import build_registry

router = APIRouter(prefix="/api/conversions", tags=["conversions"])
_registry = build_registry()


@router.get("/capabilities")
def conversion_capabilities() -> dict:
    """Enumerate supported conversion pairs and tool operations."""
    return _registry.capabilities()
