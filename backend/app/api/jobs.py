from __future__ import annotations

import time

from fastapi import APIRouter, HTTPException

from app.services.state import state

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("/{job_id}")
def get_job(job_id: str) -> dict[str, str | int]:
    job = state.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")

    elapsed = max(0.0, time.time() - job.created_at)
    progress = min(100, int((elapsed / 5) * 100))
    status = "completed" if progress >= 100 else "processing"
    return {
        "job_id": job.job_id,
        "file_id": job.file_id,
        "source_format": job.source_format,
        "target_format": job.target_format,
        "status": status,
        "progress": progress,
        "download_url": f"/api/files/{job.file_id}",
    }
