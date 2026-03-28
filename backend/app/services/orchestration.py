from uuid import uuid4


class ConversionOrchestrator:
    """Coordinates conversion requests and worker dispatch."""

    def enqueue(self, file_id: str, source_format: str, target_format: str) -> str:
        job_id = str(uuid4())
        try:
            from app.workers.tasks import queue_conversion

            queue_conversion.delay(job_id, file_id, source_format, target_format)
        except Exception:
            # Keep API usable in local/dev deployments even when broker is offline.
            pass
        return job_id
