### 03 — Dynamic Imports & Virtualization

Goal: Reduce initial JS and render cost by deferring heavy modules and virtualizing large lists.

Scope: `src/components/calendar/Calendar.tsx`, tables/lists across tenant/superadmin UIs.

Steps (Cursor prompts)
1) FullCalendar dynamic import
```
- Convert @fullcalendar/react import to dynamic(() => import(...), { ssr: false }).
- Lazy import dayGrid/timeGrid/interaction with dynamic as well.
- Add loading placeholders.
```
2) Virtualize tables
```
- Introduce @tanstack/react-virtual or react-window for long tables (users, roles, tickets).
- Extract Row components and wrap in React.memo.
```
3) Defer non-critical widgets
```
- Use next/dynamic for secondary charts/cards.
- Add Suspense boundaries where appropriate.
```
Acceptance Criteria
- Route JS shrink 30–60% on calendar-heavy routes.
- Large lists render with constant-time DOM nodes.

Rollback
- Revert dynamic imports; keep components static.

Free Tooling Choices
- next/dynamic (built-in, free)
- @tanstack/react-virtual or react-window (MIT)
