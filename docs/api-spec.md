# API Specification (Initial)

## Auth
- `POST /api/auth/login`

## Files
- `POST /api/files/upload` (raw body upload; optional `X-Filename` header)
- `POST /api/files/upload/init` (initialize chunked upload)
- `PUT /api/files/upload/{upload_id}/chunk/{chunk_index}` (upload chunk bytes)
- `POST /api/files/upload/{upload_id}/complete` (finalize and persist uploaded file)
- `GET /api/files/{file_id}`

## Conversions
- `GET /api/conversions/capabilities`
- `POST /api/conversions`

## Jobs
- `GET /api/jobs/{job_id}`

## Operations
- `GET /healthz`
