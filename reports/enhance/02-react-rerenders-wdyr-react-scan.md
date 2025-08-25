### 02 — React Re-renders: WDYR + React Scan

Goal: Detect and eliminate avoidable re-renders, then validate UX performance.

Scope: Client components (TenantSidebar, TenantRolesClient, analytics widgets, tables).

Steps (Cursor prompts)
1) Add Why Did You Render (dev only)
```
npm i -D @welldone-software/why-did-you-render
Create src/wdyr.ts with standard setup (trackAllPureComponents: true).
Import it at the top of src/providers/Providers.tsx only in development.
```
2) Memoize and stabilize
```
- In TenantSidebar.tsx: memoize handlers with useCallback, precompute permission Sets with useMemo, wrap renderMenuItems children in React.memo.
- In TenantRolesClient.tsx: split table rows to memoized Row component, memoize computed lists, debounced search.
- Ensure props for heavy children are stable (handlers/arrays/objects).
```
3) Validate with React Scan
```
- Use the React Scan extension/overlay; interact with dashboards, tables, search.
- Fix remaining hotspots it flags.
```
Acceptance Criteria
- 40–70% fewer renders on hot screens.
- React Scan shows improved update timings.

Rollback
- Remove `require('../wdyr')` import; uninstall package.

Free Tooling Choices
- Why Did You Render (free)
- React Scan browser extension (free)
- React DevTools Profiler (free)
