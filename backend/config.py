from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ConversionLimits:
    max_file_bytes: int
    max_pages: int | None = None
    max_duration_seconds: int | None = None


CONVERSION_LIMITS: dict[str, ConversionLimits] = {
    "pdf_to_docx": ConversionLimits(max_file_bytes=25 * 1024 * 1024, max_pages=500),
    "docx_to_pdf": ConversionLimits(max_file_bytes=20 * 1024 * 1024, max_pages=350),
    "audio_to_text": ConversionLimits(max_file_bytes=100 * 1024 * 1024, max_duration_seconds=2 * 60 * 60),
    "video_to_mp3": ConversionLimits(max_file_bytes=500 * 1024 * 1024, max_duration_seconds=90 * 60),
}

UPLOAD_DIR = Path("/tmp/fileconvert/uploads")
OUTPUT_DIR = Path("/tmp/fileconvert/output")
SIGNED_URL_SECRET = "change-me-in-prod"
DOWNLOAD_URL_TTL_SECONDS = 15 * 60
JOB_RETENTION_SECONDS = 6 * 60 * 60
TEMP_FILE_RETENTION_SECONDS = 60 * 60
CLEANUP_SWEEP_SECONDS = 60 * 10
RATE_LIMIT_PER_MINUTE = 60
CLAMAV_HOST = "localhost"
CLAMAV_PORT = 3310
PROMETHEUS_METRICS_PATH = "/metrics"
