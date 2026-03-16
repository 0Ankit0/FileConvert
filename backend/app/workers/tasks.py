from app.workers.celery_app import celery_app


@celery_app.task(name="convert_file")
def queue_conversion(job_id: str, file_id: str, source_format: str, target_format: str) -> dict[str, str]:
    return {
        "job_id": job_id,
        "file_id": file_id,
        "source_format": source_format,
        "target_format": target_format,
        "status": "completed",
    }
