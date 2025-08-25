### 10 — Observability & Telemetry

Goal: Gain visibility into performance and errors in production.

Steps (Cursor prompts)
1) Structured logging
```
- Integrate Pino (server) with transport to console; redact PII fields.
```
2) Tracing
```
- Add OpenTelemetry SDK for Next (API routes) and export traces to OTLP endpoint.
```
3) Error tracking
```
- Add Sentry (or equivalent) with DSN via env; capture exceptions in API and boundary fallbacks.
```
Acceptance Criteria
- Logs are structured; traces visible for key flows; unhandled errors reported.

Rollback
- Disable via env flags in non-critical envs.

Free Tooling Choices
- Pino (MIT); OpenTelemetry SDK; Jaeger/Tempo (self-hosted, free)
- Error tracking: GlitchTip (OSS) or self-hosted Sentry (free tier)
