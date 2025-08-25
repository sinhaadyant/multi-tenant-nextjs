### 01 — Logging Hardening

Goal: Reduce production log noise and enable structured, safe logging.

Scope: `next.config.ts`, `src/lib/api.ts`, major layouts/components with verbose logs, API routes.

Steps (Cursor prompts):
1) Configure production console stripping
```
Open next.config.ts and set:
- compiler.removeConsole to { exclude: ['error', 'warn'] }
- Ensure `compress: true` remains on.
```
2) Guard remaining logs by environment
```
Find console.log/warn in src/**/*.ts* and wrap non-critical logs:
if (process.env.NODE_ENV !== 'production') console.log(...)
```
3) Introduce a tiny logger
```
Create src/lib/logger.ts:
- export info/warn/error that noop in production for info, keep error/warn.
- Replace scattered console calls in hot paths (TenantSidebar, api.ts) with logger.
```
Acceptance Criteria
- No non-essential logs in production build.
- Hot screens show substantial log reduction.
- Errors still captured.

Rollback
- Revert `compiler.removeConsole` or guard changes.

Free Tooling Choices
- Logger: Pino (MIT) or console wrappers (free)
- Log viewing: Grafana Loki + Promtail + Grafana (self-hosted, free)
