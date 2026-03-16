from __future__ import annotations

import json
import logging
import os
import time
from contextlib import contextmanager
from typing import Any, Iterator

from opentelemetry import trace
from prometheus_client import Counter, Histogram, generate_latest

REQUEST_COUNTER = Counter("fileconvert_requests_total", "Total HTTP requests", ["route", "method", "status"])
JOB_COUNTER = Counter("fileconvert_jobs_total", "Total conversion jobs", ["conversion_type", "status"])
JOB_LATENCY = Histogram("fileconvert_job_duration_seconds", "Job processing latency", ["conversion_type"])


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        extra = getattr(record, "extra", None)
        if isinstance(extra, dict):
            payload.update(extra)
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def configure_logging() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)


tracer = trace.get_tracer("fileconvert.backend")


@contextmanager
def job_span(conversion_type: str) -> Iterator[None]:
    with tracer.start_as_current_span("conversion.job", attributes={"conversion.type": conversion_type}):
        yield


def metrics_payload() -> bytes:
    return generate_latest()


def init_error_tracking() -> None:
    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        return
    try:
        import sentry_sdk

        sentry_sdk.init(dsn=dsn, traces_sample_rate=0.05)
    except Exception:
        logging.getLogger(__name__).warning("failed to initialize sentry")


def report_exception(exc: Exception, context: dict[str, Any] | None = None) -> None:
    try:
        import sentry_sdk

        if context:
            with sentry_sdk.push_scope() as scope:
                for k, v in context.items():
                    scope.set_tag(k, str(v))
                sentry_sdk.capture_exception(exc)
        else:
            sentry_sdk.capture_exception(exc)
    except Exception:
        logging.getLogger(__name__).error("error reporting failure", exc_info=exc)
