### 09 — Tenant Middleware Enforcement

Goal: Ensure strict tenant data isolation at the API layer.

Steps (Cursor prompts)
1) Standardize middleware
```
- Use withTenantAuth (tenantAuthMiddleware) everywhere; deprecate legacy wrappers.
- Verify all Prisma queries include tenantId filter matching auth context.
```
2) Central helper
```
- Add a helper to extract tenantId from request and assert against params.
- Reject cross-tenant access attempts with 403.
```
3) Tests
```
- Add tests simulating cross-tenant access to ensure denial.
```
Acceptance Criteria
- All API routes protected; queries are tenant-scoped.

Rollback
- Keep legacy wrapper for endpoints pending migration.

Free Tooling Choices
- Built-in middleware pattern; Prisma tenant filters (free)
