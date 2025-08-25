### 16 — Prefetch & Navigation Optimizations

Goal: Speed up route transitions without overfetching.

Steps (Cursor prompts)
1) Standardize prefetch
```
- Adopt src/lib/prefetch.tsx utilities: PrefetchLink, hover/viewport prefetch, role-based/tenant routes.
- Replace ad-hoc router.prefetch calls; ensure prefetch only on hover/viewport for heavy routes.
```
2) Next Link usage
```
- Use <Link prefetch> for small routes; disable prefetch where payloads are heavy.
```
3) Critical resources
```
- Prefetch only essential APIs; avoid spamming network on low-end devices.
```
Acceptance Criteria
- Faster navigations on common flows; no network thrash.

Rollback
- Disable prefetch utilities via env flag.

Free Tooling Choices
- Next Link prefetch (built-in); your custom prefetch utils (free)
