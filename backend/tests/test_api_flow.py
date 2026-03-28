from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from fastapi import HTTPException
from starlette.requests import Request

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.api.conversions import ConversionRequest, create_conversion
from app.api.files import (
    _store_upload,
    complete_chunked_upload,
    get_file,
    init_chunked_upload,
    upload_chunk,
    UploadCompleteRequest,
    UploadInitRequest,
)
from app.api.jobs import get_job
from app.main import healthcheck
from app.services.state import state


def setup_function() -> None:
    state.files.clear()
    state.jobs.clear()
    state.uploads.clear()


def test_healthcheck() -> None:
    assert healthcheck() == {"status": "ok"}


def test_end_to_end_upload_convert_and_poll() -> None:
    upload = _store_upload(
        filename="input.pdf",
        payload=b"%PDF-1.4\n1 0 obj <</Type /Page>>",
        content_type="application/pdf",
    )
    file_id = upload["file_id"]

    create_job = create_conversion(
        ConversionRequest(
            file_id=file_id,
            source_format="application/pdf",
            target_format="image/png",
        )
    )
    assert create_job["status"] == "queued"
    job_id = create_job["job_id"]

    status_json = get_job(job_id)
    assert status_json["job_id"] == job_id
    assert status_json["file_id"] == file_id
    assert 0 <= status_json["progress"] <= 100
    assert get_file(file_id)["file_id"] == file_id


def test_reject_unsupported_conversion_pair() -> None:
    upload = _store_upload("input.txt", b"hello", "text/plain")
    file_id = upload["file_id"]

    try:
        create_conversion(
            ConversionRequest(
                file_id=file_id,
                source_format="text/plain",
                target_format="application/x-unknown",
            )
        )
        assert False, "Expected unsupported conversion pair to raise HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 400


def test_reject_empty_upload_payload() -> None:
    try:
        _store_upload("empty.bin", b"", "application/octet-stream")
        assert False, "Expected empty uploads to raise HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 400


def _build_request(body: bytes, content_type: str = "application/octet-stream") -> Request:
    async def receive() -> dict:
        return {"type": "http.request", "body": body, "more_body": False}

    return Request({"type": "http", "method": "PUT", "headers": [(b"content-type", content_type.encode())]}, receive)


def test_chunked_upload_round_trip() -> None:
    raw = b"chunked-content-" * 1024
    init = init_chunked_upload(
        UploadInitRequest(
            filename="chunked.bin",
            content_type="application/octet-stream",
            file_size=len(raw),
        )
    )
    upload_id = str(init["upload_id"])
    chunk_size = int(init["chunk_size"])
    total_chunks = int(init["total_chunks"])
    assert total_chunks >= 1

    for chunk_index in range(total_chunks):
        start = chunk_index * chunk_size
        end = min(len(raw), start + chunk_size)
        req = _build_request(raw[start:end])
        response = asyncio.run(upload_chunk(upload_id, chunk_index, req))
        assert response["chunk_index"] == chunk_index

    complete = complete_chunked_upload(upload_id, UploadCompleteRequest(upload_id=upload_id))
    file_id = complete["file_id"]
    metadata = get_file(file_id)
    assert metadata["size_bytes"] == len(raw)
