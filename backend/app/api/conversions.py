from fastapi import APIRouter
from pydantic import BaseModel

from app.services.orchestration import ConversionOrchestrator

router = APIRouter()


class ConversionRequest(BaseModel):
    file_id: str
    source_format: str
    target_format: str


@router.post("")
def create_conversion(payload: ConversionRequest) -> dict[str, str]:
    orchestrator = ConversionOrchestrator()
    job_id = orchestrator.enqueue(payload.file_id, payload.source_format, payload.target_format)
    return {"job_id": job_id, "status": "queued"}
