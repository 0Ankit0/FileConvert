from __future__ import annotations

import asyncio
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from pathlib import Path
from uuid import uuid4

from .config import CLEANUP_SWEEP_SECONDS, JOB_RETENTION_SECONDS, TEMP_FILE_RETENTION_SECONDS

logger = logging.getLogger(__name__)


class RateLimiter:
    def __init__(self, events_per_minute: int) -> None:
        self.events_per_minute = events_per_minute
        self._events: dict[str, deque[float]] = defaultdict(deque)

    def consume(self, key: str) -> bool:
        now = time.time()
        window_start = now - 60
        q = self._events[key]
        while q and q[0] < window_start:
            q.popleft()
        if len(q) >= self.events_per_minute:
            return False
        q.append(now)
        return True


@dataclass
class JobRecord:
    job_id: str
    conversion_type: str
    input_path: Path
    output_path: Path
    owner_id: str
    created_at: float = field(default_factory=time.time)
    completed_at: float | None = None


class JobStore:
    def __init__(self) -> None:
        self.jobs: dict[str, JobRecord] = {}

    def create(self, conversion_type: str, input_path: Path, output_path: Path, owner_id: str) -> JobRecord:
        rec = JobRecord(
            job_id=str(uuid4()),
            conversion_type=conversion_type,
            input_path=input_path,
            output_path=output_path,
            owner_id=owner_id,
        )
        self.jobs[rec.job_id] = rec
        return rec

    def mark_complete(self, job_id: str) -> None:
        self.jobs[job_id].completed_at = time.time()

    def get(self, job_id: str) -> JobRecord | None:
        return self.jobs.get(job_id)

    def cleanup_completed(self, retention_seconds: int = JOB_RETENTION_SECONDS) -> int:
        now = time.time()
        remove_ids = [
            jid
            for jid, rec in self.jobs.items()
            if rec.completed_at is not None and now - rec.completed_at > retention_seconds
        ]
        for jid in remove_ids:
            rec = self.jobs.pop(jid)
            for p in (rec.input_path, rec.output_path):
                if p.exists():
                    p.unlink(missing_ok=True)
        return len(remove_ids)


def cleanup_temp_files(paths: list[Path], retention_seconds: int = TEMP_FILE_RETENTION_SECONDS) -> int:
    now = time.time()
    removed = 0
    for root in paths:
        if not root.exists():
            continue
        for file in root.glob("**/*"):
            if not file.is_file():
                continue
            if now - file.stat().st_mtime > retention_seconds:
                file.unlink(missing_ok=True)
                removed += 1
    return removed


async def cleanup_loop(job_store: JobStore, roots: list[Path]) -> None:
    while True:
        jobs = job_store.cleanup_completed()
        files = cleanup_temp_files(roots)
        logger.info("cleanup sweep complete", extra={"extra": {"deleted_jobs": jobs, "deleted_files": files}})
        await asyncio.sleep(CLEANUP_SWEEP_SECONDS)
