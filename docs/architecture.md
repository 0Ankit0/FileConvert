# Architecture

FileConvert uses a split frontend/backend architecture with asynchronous conversion jobs.

## Components
- React + Vite frontend for uploads, conversion selection, and status tracking.
- FastAPI backend exposing auth, files, conversion, and job APIs.
- Celery workers consuming conversion jobs from Redis.
- Storage abstraction for local filesystem and S3-compatible object stores.
- Nginx reverse proxy routing `/api` to backend and everything else to frontend.
