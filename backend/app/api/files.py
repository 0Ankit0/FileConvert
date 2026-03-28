from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, Field

from app.services.state import StoredFile, UploadSession, state
from app.storage.local import LocalStorageProvider

router = APIRouter(prefix="/api/files", tags=["files"])
_storage = LocalStorageProvider(root="/tmp/fileconvert/storage")
_chunk_root = Path("/tmp/fileconvert/chunks")
_chunk_root.mkdir(parents=True, exist_ok=True)
CHUNK_SIZE_BYTES = 5 * 1024 * 1024  # 5MB


class UploadInitRequest(BaseModel):
    filename: str
    content_type: str = "application/octet-stream"
    file_size: int = Field(gt=0)


class UploadCompleteRequest(BaseModel):
    upload_id: str


def _store_upload_from_path(filename: str, source_path: Path, content_type: str, size_bytes: int) -> dict[str, str]:
    if size_bytes <= 0:
        raise HTTPException(status_code=400, detail="empty upload payload")
    file_id = str(uuid4())
    object_key = f"uploads/{file_id}-{filename}"
    _storage.save_file(object_key, source_path)
    state.put_file(
        StoredFile(
            file_id=file_id,
            filename=filename or "upload.bin",
            content_type=content_type or "application/octet-stream",
            object_key=object_key,
            size_bytes=size_bytes,
        )
    )
    return {
        "file_id": file_id,
        "filename": filename or "upload.bin",
        "content_type": content_type or "application/octet-stream",
    }


def _store_upload(filename: str, payload: bytes, content_type: str) -> dict[str, str]:
    with tempfile.NamedTemporaryFile(prefix="fileconvert-upload-", delete=False) as temp:
        temp.write(payload)
        temp_path = Path(temp.name)
    try:
        return _store_upload_from_path(filename=filename, source_path=temp_path, content_type=content_type, size_bytes=len(payload))
    finally:
        temp_path.unlink(missing_ok=True)


@router.post("/upload")
async def upload_file(request: Request, x_filename: str | None = Header(default=None)) -> dict[str, str]:
    raw_content_type = request.headers.get("content-type", "application/octet-stream")
    filename = x_filename or "upload.bin"
    content_type = raw_content_type
    with tempfile.NamedTemporaryFile(prefix="fileconvert-upload-", delete=False) as temp:
        temp_path = Path(temp.name)
    total_bytes = 0

    try:
        if raw_content_type.startswith("multipart/form-data"):
            try:
                form = await request.form()
            except Exception as exc:
                raise HTTPException(status_code=400, detail="invalid multipart form payload") from exc

            uploaded = form.get("file")
            if uploaded is None or not hasattr(uploaded, "read"):
                raise HTTPException(status_code=400, detail="multipart field 'file' is required")
            filename = getattr(uploaded, "filename", filename) or filename
            content_type = getattr(uploaded, "content_type", content_type) or content_type

            with temp_path.open("wb") as out:
                while True:
                    chunk = await uploaded.read(CHUNK_SIZE_BYTES)
                    if not chunk:
                        break
                    out.write(chunk)
                    total_bytes += len(chunk)
        else:
            with temp_path.open("wb") as out:
                async for chunk in request.stream():
                    if not chunk:
                        continue
                    out.write(chunk)
                    total_bytes += len(chunk)

        return _store_upload_from_path(
            filename=filename,
            source_path=temp_path,
            content_type=content_type,
            size_bytes=total_bytes,
        )
    finally:
        temp_path.unlink(missing_ok=True)


@router.post("/upload/init")
def init_chunked_upload(payload: UploadInitRequest) -> dict[str, int | str]:
    upload_id = str(uuid4())
    total_chunks = (payload.file_size + CHUNK_SIZE_BYTES - 1) // CHUNK_SIZE_BYTES
    state.put_upload(
        UploadSession(
            upload_id=upload_id,
            filename=payload.filename or "upload.bin",
            content_type=payload.content_type or "application/octet-stream",
            file_size=payload.file_size,
            chunk_size=CHUNK_SIZE_BYTES,
            total_chunks=total_chunks,
        )
    )
    (_chunk_root / upload_id).mkdir(parents=True, exist_ok=True)
    return {"upload_id": upload_id, "chunk_size": CHUNK_SIZE_BYTES, "total_chunks": total_chunks}


@router.put("/upload/{upload_id}/chunk/{chunk_index}")
async def upload_chunk(upload_id: str, chunk_index: int, request: Request) -> dict[str, int | str]:
    session = state.get_upload(upload_id)
    if not session:
        raise HTTPException(status_code=404, detail="upload session not found")
    if chunk_index < 0 or chunk_index >= session.total_chunks:
        raise HTTPException(status_code=400, detail="chunk index out of range")

    payload = await request.body()
    if not payload:
        raise HTTPException(status_code=400, detail="empty chunk payload")
    if len(payload) > session.chunk_size:
        raise HTTPException(status_code=400, detail="chunk payload exceeds chunk size")

    chunk_path = _chunk_root / upload_id / f"{chunk_index:08d}.part"
    chunk_path.write_bytes(payload)
    session.received_chunks.add(chunk_index)
    return {"upload_id": upload_id, "received_chunks": len(session.received_chunks), "chunk_index": chunk_index}


@router.post("/upload/{upload_id}/complete")
def complete_chunked_upload(upload_id: str, payload: UploadCompleteRequest) -> dict[str, str]:
    if payload.upload_id != upload_id:
        raise HTTPException(status_code=400, detail="upload id mismatch")

    session = state.get_upload(upload_id)
    if not session:
        raise HTTPException(status_code=404, detail="upload session not found")
    if len(session.received_chunks) != session.total_chunks:
        raise HTTPException(status_code=400, detail="not all chunks received")

    upload_dir = _chunk_root / upload_id
    with tempfile.NamedTemporaryFile(prefix="fileconvert-assembled-", delete=False) as temp:
        assembled_path = Path(temp.name)

    assembled_size = 0
    try:
        with assembled_path.open("wb") as out:
            for index in range(session.total_chunks):
                part_path = upload_dir / f"{index:08d}.part"
                if not part_path.exists():
                    raise HTTPException(status_code=400, detail=f"missing chunk {index}")
                with part_path.open("rb") as part:
                    shutil.copyfileobj(part, out, length=1024 * 1024)
                assembled_size += part_path.stat().st_size

        if assembled_size != session.file_size:
            raise HTTPException(status_code=400, detail="assembled file size mismatch")

        result = _store_upload_from_path(
            filename=session.filename,
            source_path=assembled_path,
            content_type=session.content_type,
            size_bytes=assembled_size,
        )
        state.delete_upload(upload_id)
        shutil.rmtree(upload_dir, ignore_errors=True)
        return result
    finally:
        assembled_path.unlink(missing_ok=True)


@router.get("/{file_id}")
def get_file(file_id: str) -> dict[str, str | int]:
    item = state.get_file(file_id)
    if not item:
        raise HTTPException(status_code=404, detail="file not found")
    return {
        "file_id": item.file_id,
        "filename": item.filename,
        "content_type": item.content_type,
        "size_bytes": item.size_bytes,
    }
