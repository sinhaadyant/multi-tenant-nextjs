### 08 — Security: Rate Limiting & CSRF

Goal: Guard APIs against abuse and CSRF.

Steps (Cursor prompts)
1) Rate limiting
```
- Add middleware for per-IP + per-tenant limits (Upstash/Redis or in-memory for dev).
- Apply to sensitive endpoints (auth, password reset, notifications, reports).
```
2) CSRF protection for mutations
```
- For same-site flows, include a CSRF header/token validated in middleware.
- For API routes, reject missing/invalid tokens.
```
3) Secrets & headers
```
- Ensure strong JWT secret rotation plan; set security headers in next.config.ts headers().
```
Acceptance Criteria
- Repeated hits are throttled; CSRF checks enforced on mutating routes.

Rollback
- Disable limiter via env flag for local testing.

Free Tooling Choices
- rate-limiter-flexible (free) or simple LRU via lru-cache
- Native header tokens for CSRF (free)
