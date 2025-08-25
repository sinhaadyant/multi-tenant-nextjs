### 11 — Testing Matrix

Goal: Ensure critical flows are covered by unit and E2E tests.

Steps (Cursor prompts)
1) Unit tests
```
- Add tests for RBAC (permissions selectors), reducers, and utility functions.
- Mock Prisma for service-level tests with in-memory DB or test containers.
```
2) E2E tests
```
- Add flows: login, sidebar gating, create/edit role, notifications, support ticket lifecycles.
- Seed data per test; use data-testids.
```
3) CI setup
```
- Run unit + E2E on CI; collect coverage; block merges under threshold.
```
Acceptance Criteria
- Core flows green in CI; coverage trend improving.

Free Tooling Choices
- Jest + Testing Library + Playwright (all free)
