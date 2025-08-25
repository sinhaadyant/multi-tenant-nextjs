### 14 — API Caching (ETags) & Background Jobs

Goal: Reduce API latency and server load; offload long tasks.

Steps (Cursor prompts)
1) Add ETag/If-None-Match
```
- Create a helper to compute strong ETags from JSON payloads (hash).
- In read-heavy endpoints, check req.headers['if-none-match']; return 304 if match.
- Set Cache-Control with reasonable max-age + stale-while-revalidate.
```
2) Background jobs for heavy tasks (reports)
```
- Add a jobs queue (BullMQ/Upstash/QStash).
- Change report-generation POST to enqueue and return 202 with jobId.
- Add /reports/:id/status endpoint to poll progress; notify via socket on completion.
```
3) Batch endpoints
```
- Create dashboard aggregate endpoint to batch multiple small queries.
```
Acceptance Criteria
- Repeated GETs hit 304 often; report generation returns quickly and completes async.

Rollback
- Keep synchronous path behind feature flag.

Free Tooling Choices
- ETag/Cache-Control (built-in); Bull/BullMQ + Redis OSS (self-hosted)
