from __future__ import annotations

import time
from dataclasses import dataclass, field


@dataclass(slots=True)
class StoredFile:
    file_id: str
    filename: str
    content_type: str
    object_key: str
    size_bytes: int
    created_at: float = field(default_factory=time.time)


@dataclass(slots=True)
class JobStatus:
    job_id: str
    file_id: str
    source_format: str
    target_format: str
    created_at: float = field(default_factory=time.time)


@dataclass(slots=True)
class UploadSession:
    upload_id: str
    filename: str
    content_type: str
    file_size: int
    chunk_size: int
    total_chunks: int
    received_chunks: set[int] = field(default_factory=set)
    created_at: float = field(default_factory=time.time)


class InMemoryState:
    def __init__(self) -> None:
        self.files: dict[str, StoredFile] = {}
        self.jobs: dict[str, JobStatus] = {}
        self.uploads: dict[str, UploadSession] = {}

    def put_file(self, item: StoredFile) -> None:
        self.files[item.file_id] = item

    def get_file(self, file_id: str) -> StoredFile | None:
        return self.files.get(file_id)

    def put_job(self, job: JobStatus) -> None:
        self.jobs[job.job_id] = job

    def get_job(self, job_id: str) -> JobStatus | None:
        return self.jobs.get(job_id)

    def put_upload(self, upload: UploadSession) -> None:
        self.uploads[upload.upload_id] = upload

    def get_upload(self, upload_id: str) -> UploadSession | None:
        return self.uploads.get(upload_id)

    def delete_upload(self, upload_id: str) -> None:
        self.uploads.pop(upload_id, None)


state = InMemoryState()
