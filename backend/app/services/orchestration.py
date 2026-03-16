from uuid import uuid4

from app.workers.tasks import queue_conversion


class ConversionOrchestrator:
    """Coordinates conversion requests and worker dispatch."""

    def enqueue(self, file_id: str, source_format: str, target_format: str) -> str:
        job_id = str(uuid4())
        queue_conversion.delay(job_id, file_id, source_format, target_format)
        return job_id
