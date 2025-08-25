### 06 — Error Boundaries & Fallbacks

Goal: Prevent full UI crashes and provide graceful fallbacks.

Steps (Cursor prompts)
1) Add ErrorBoundary component
```
- Create src/components/common/ErrorBoundary.tsx using React.ErrorBoundary-like pattern.
- Wrap dashboards, tables, and modal roots.
```
2) Next.js route-level handling
```
- Add error.tsx to critical routes under app/ to render fallback UIs.
- Provide retry buttons and minimal diagnostics.
```
Acceptance Criteria
- Runtime errors do not white-screen; fallbacks render with retry.

Rollback
- Remove wrappers; rely on default error pages.

Free Tooling Choices
- Native React Error Boundaries (free)
- Next.js error.tsx (built-in)
