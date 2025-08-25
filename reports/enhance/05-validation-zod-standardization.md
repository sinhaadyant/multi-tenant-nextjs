### 05 — Validation: Zod Standardization

Goal: Enforce consistent input validation on server and client.

Scope: API routes under `src/app/api/**`, client forms using react-hook-form.

Steps (Cursor prompts)
1) Centralize schemas
```
- Create src/lib/schemas/<domain>.ts with Zod schemas for users, roles, notifications, tickets.
- Export types via z.infer.
```
2) Apply to API routes
```
- Use schema.safeParse on request bodies/params; return 400 with errors.
- Ensure Prisma selects align with validated shapes.
```
3) Apply to forms
```
- Add zodResolver in RHF; show field-level errors; add debounced validation for search/filter inputs.
```
Acceptance Criteria
- All write endpoints validate payloads with Zod.
- Forms show inline errors mapped from schemas.

Rollback
- Keep previous lightweight checks behind a flag.

Free Tooling Choices
- Zod (MIT)
- @hookform/resolvers (MIT)
