from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.plugins import build_registry
from app.services.orchestration import ConversionOrchestrator
from app.services.state import JobStatus, state

router = APIRouter(prefix="/api/conversions", tags=["conversions"])
_registry = build_registry()
_orchestrator = ConversionOrchestrator()


class ConversionRequest(BaseModel):
    file_id: str
    source_format: str
    target_format: str


@router.get("/capabilities")
def conversion_capabilities() -> dict:
    """Enumerate supported conversion pairs and tool operations."""
    return _registry.capabilities()


@router.post("")
def create_conversion(payload: ConversionRequest) -> dict[str, str]:
    file_item = state.get_file(payload.file_id)
    if not file_item:
        raise HTTPException(status_code=404, detail="file not found")

    requested_pair = (payload.source_format.lower(), payload.target_format.lower())
    available_pairs = {
        (entry["input_mime"].lower(), entry["output_mime"].lower())
        for entry in _registry.capabilities()["conversions"]
    }
    if requested_pair not in available_pairs:
        raise HTTPException(status_code=400, detail="unsupported conversion pair")

    job_id = _orchestrator.enqueue(payload.file_id, payload.source_format, payload.target_format)
    state.put_job(
        JobStatus(
            job_id=job_id,
            file_id=payload.file_id,
            source_format=payload.source_format,
            target_format=payload.target_format,
        )
    )

    return {"job_id": job_id, "status": "queued"}
