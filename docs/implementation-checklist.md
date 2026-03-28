# Implementation Checklist

Simple checklist of previously incomplete items and their completion status.

- [x] Replace client-provided metadata headers for page/duration limits with backend-side metadata extraction.
- [x] Keep document and media safety limits enforced using extracted metadata.
- [x] Document the new metadata extraction behavior in the security/operations guide.
- [x] Wire all documented API routers into `app.main` (auth/files/conversions/jobs).
- [x] Implement `POST /api/conversions` with file existence checks and conversion capability validation.
- [x] Implement `GET /api/jobs/{job_id}` with tracked status/progress responses.
- [x] Add a `/healthz` endpoint for deployment health checks.
- [x] Ensure deployment dependencies include Celery broker client for worker dispatch.
- [x] Support uploads without requiring multipart parser installation (raw body + `X-Filename`).
- [x] Add chunked upload backend endpoints (init/chunk/complete) for large file support.
- [x] Integrate frontend chunked upload flow with upload progress feedback.
