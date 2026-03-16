from __future__ import annotations

import asyncio
import logging
import shutil
import time
from pathlib import Path

from fastapi import FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.responses import PlainTextResponse

from .config import (
    CLAMAV_HOST,
    CLAMAV_PORT,
    CONVERSION_LIMITS,
    DOWNLOAD_URL_TTL_SECONDS,
    OUTPUT_DIR,
    PROMETHEUS_METRICS_PATH,
    RATE_LIMIT_PER_MINUTE,
    SIGNED_URL_SECRET,
    UPLOAD_DIR,
)
from .observability import (
    JOB_COUNTER,
    JOB_LATENCY,
    REQUEST_COUNTER,
    configure_logging,
    init_error_tracking,
    job_span,
    metrics_payload,
    report_exception,
)
from .security import ClamAVScanner, SignedURLService, ValidationError, validate_extension_and_mime
from .services import JobStore, RateLimiter, cleanup_loop

configure_logging()
init_error_tracking()
logger = logging.getLogger(__name__)

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="FileConvert backend")
rate_limiter = RateLimiter(events_per_minute=RATE_LIMIT_PER_MINUTE)
job_store = JobStore()
scanner = ClamAVScanner(CLAMAV_HOST, CLAMAV_PORT)
signed_urls = SignedURLService(SIGNED_URL_SECRET)


@app.middleware("http")
async def request_observer(request: Request, call_next):
    response = await call_next(request)
    REQUEST_COUNTER.labels(route=request.url.path, method=request.method, status=response.status_code).inc()
    return response


@app.on_event("startup")
async def startup() -> None:
    app.state.cleanup_task = asyncio.create_task(cleanup_loop(job_store, [UPLOAD_DIR, OUTPUT_DIR]))


@app.on_event("shutdown")
async def shutdown() -> None:
    app.state.cleanup_task.cancel()


@app.get(PROMETHEUS_METRICS_PATH, response_class=PlainTextResponse)
def metrics() -> bytes:
    return metrics_payload()


@app.post("/jobs/{conversion_type}")
async def create_job(
    conversion_type: str,
    request: Request,
    file: UploadFile = File(...),
    x_user_id: str | None = Header(default=None),
):
    owner = x_user_id or request.client.host
    ip = request.client.host

    if not rate_limiter.consume(f"ip:{ip}"):
        raise HTTPException(status_code=429, detail="rate limit exceeded for IP")
    if x_user_id and not rate_limiter.consume(f"user:{x_user_id}"):
        raise HTTPException(status_code=429, detail="rate limit exceeded for user")

    if conversion_type not in CONVERSION_LIMITS:
        raise HTTPException(status_code=400, detail="unsupported conversion type")
    limits = CONVERSION_LIMITS[conversion_type]

    input_path = UPLOAD_DIR / f"{int(time.time())}-{file.filename}"
    with input_path.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    try:
        mime = validate_extension_and_mime(input_path, conversion_type)

        if input_path.stat().st_size > limits.max_file_bytes:
            raise ValidationError("file size exceeds limit")

        # Placeholder extraction hooks for media metadata/page counts.
        estimated_pages = int(request.headers.get("x-pages", "0")) or None
        estimated_duration = int(request.headers.get("x-duration-seconds", "0")) or None

        if limits.max_pages is not None and estimated_pages and estimated_pages > limits.max_pages:
            raise ValidationError("page count exceeds limit")
        if (
            limits.max_duration_seconds is not None
            and estimated_duration
            and estimated_duration > limits.max_duration_seconds
        ):
            raise ValidationError("media duration exceeds limit")

        scanner.scan_file(input_path)

        output_path = OUTPUT_DIR / f"{input_path.stem}-converted.bin"
        output_path.write_bytes(input_path.read_bytes())

        with job_span(conversion_type):
            start = time.perf_counter()
            job = job_store.create(conversion_type, input_path, output_path, owner)
            job_store.mark_complete(job.job_id)
            JOB_LATENCY.labels(conversion_type=conversion_type).observe(time.perf_counter() - start)
            JOB_COUNTER.labels(conversion_type=conversion_type, status="success").inc()

        expires_at = int(time.time()) + DOWNLOAD_URL_TTL_SECONDS
        token = signed_urls.create_token(job.job_id, expires_at)

        logger.info(
            "job completed",
            extra={
                "extra": {
                    "job_id": job.job_id,
                    "conversion_type": conversion_type,
                    "mime": mime,
                    "owner_id": owner,
                }
            },
        )

        return {
            "job_id": job.job_id,
            "download_url": f"/download/{token}",
            "expires_at": expires_at,
        }
    except ValidationError as exc:
        JOB_COUNTER.labels(conversion_type=conversion_type, status="rejected").inc()
        input_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        JOB_COUNTER.labels(conversion_type=conversion_type, status="error").inc()
        report_exception(exc, {"conversion_type": conversion_type})
        logger.exception("job failed", extra={"extra": {"conversion_type": conversion_type}})
        input_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="internal error") from exc


@app.get("/download/{token}")
def download_file(token: str):
    try:
        job_id = signed_urls.verify_token(token)
    except ValidationError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    job = job_store.get(job_id)
    if not job or not job.output_path.exists():
        raise HTTPException(status_code=404, detail="file not found")
    return PlainTextResponse(job.output_path.read_text(errors="replace"))
