# Security and Operations Safeguards

## Upload Validation and Guardrails

- **MIME sniffing plus extension checks** are applied before processing:
  - Extension is validated against the conversion type allow-list.
  - MIME is derived from magic bytes + fallback MIME guess and compared to an allow-list.
- **Per-conversion limits** are enforced:
  - Maximum file size in bytes.
  - Maximum page count for document workflows.
  - Maximum media duration for A/V workflows.
- Metadata checks are extracted server-side:
  - PDF page counts are inferred from PDF page object markers.
  - DOCX page counts are read from `docProps/app.xml` when available.
  - WAV duration is read from frame metadata.
  - Audio/video duration falls back to `ffprobe` when available.

## Malware Scanning

- A **ClamAV INSTREAM integration hook** is called for each uploaded file.
- Behavior:
  - `FOUND` results are rejected with a validation error.
  - Scanner unavailability is surfaced as an infrastructure error.
- Recommended deployment:
  - Run ClamAV daemon as a sidecar or dedicated internal service.
  - Alert on scan unavailability/error-rate spikes.

## Rate Limiting

- Inbound requests are rate-limited per:
  - IP address (always).
  - User ID (`X-User-Id`), when provided.
- The current implementation is in-memory and process-local.
- For multi-instance deployment, migrate to shared state (Redis) with atomic increments + TTL.

## Signed Download URLs

- Download links are generated with:
  - Object identifier.
  - Expiration timestamp.
  - HMAC SHA-256 signature.
- Tokens are rejected when expired or signature verification fails.
- Rotate the signing secret periodically and load via secure secret management.

## Data Lifecycle and Cleanup

- A periodic cleanup task removes:
  - Completed jobs older than retention policy.
  - Temporary upload/output files older than retention policy.
- Ensure cleanup windows satisfy legal/compliance retention requirements.
- For high-throughput systems, move cleanup into a dedicated worker and track deletions as audit events.

## Observability

### Structured Logging

- Logs are emitted as JSON with consistent fields (`ts`, `level`, `logger`, `message`) and contextual metadata.
- Add request/job correlation IDs at ingress for better traceability.

### Metrics (Prometheus)

- `/metrics` endpoint exports:
  - HTTP request count by route/method/status.
  - Job count by conversion type and outcome.
  - Job duration histogram by conversion type.

### Tracing Hooks

- Conversion execution is wrapped in an OpenTelemetry span (`conversion.job`) with conversion attributes.
- Wire an OTLP exporter in runtime config to emit traces to your collector.

### Error Tracking Integration

- Sentry bootstrap hook is included (`SENTRY_DSN` environment variable).
- Runtime failures can be captured with contextual tags.
- Keep sampling rates conservative and scrub sensitive payloads before capture.

## Hardening Recommendations

- Enforce authn/authz for conversion and download routes.
- Prefer object storage pre-signed URLs over local file serving for large output files.
- Add antivirus result caching by content hash to reduce duplicate scan load.
- Add circuit-breaker behavior around converter and scanning dependencies.
- Add background queue (e.g., Celery/RQ) for asynchronous conversions and retries.
