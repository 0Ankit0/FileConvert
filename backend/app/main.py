from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.conversions import router as conversions_router
from app.api.files import router as files_router
from app.api.jobs import router as jobs_router

app = FastAPI(title="FileConvert API")
app.include_router(auth_router)
app.include_router(files_router)
app.include_router(conversions_router)
app.include_router(jobs_router)


@app.get("/healthz", tags=["ops"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
