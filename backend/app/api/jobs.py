from fastapi import APIRouter

router = APIRouter()


@router.get("/{job_id}")
def get_job(job_id: str) -> dict[str, str | int]:
    return {
        "job_id": job_id,
        "status": "processing",
        "progress": 42,
        "download_url": "",
    }
