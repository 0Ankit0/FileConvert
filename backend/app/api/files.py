from uuid import uuid4

from fastapi import APIRouter, File, UploadFile

router = APIRouter()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)) -> dict[str, str]:
    file_id = str(uuid4())
    return {
        "file_id": file_id,
        "filename": file.filename,
        "content_type": file.content_type or "application/octet-stream",
    }
