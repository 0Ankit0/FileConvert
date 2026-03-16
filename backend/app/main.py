from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, conversions, files, jobs

app = FastAPI(
    title="FileConvert API",
    description="API for file conversion workflows.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(conversions.router, prefix="/api/conversions", tags=["conversions"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
