### Project Audit: Multi-Tenant Next.js Admin Panel

#### 1) Code Health & Issues (high-signal findings)

- **Re-renders (handlers/props not memoized)**
  - `src/layout/TenantSidebar.tsx`: frequent console logging and multiple inline callbacks in render; heavy `getTenantNavElements` work without memoized dependencies; `renderMenuItems` recreates closures per render; `useSelector((state: any) => ...)` without shallow compare.
  - `src/components/tenant/DynamicAnalyticsCharts.tsx`: multiple `useMemo` good, but `fetchAnalyticsData` not `useCallback`; state toggles trigger full chart re-compute; no Suspense boundary.
  - `src/components/tenant/TenantRolesClient.tsx`: large component with many local states; filtered/sorted/paginated list recomputes on every relevant state change; table rows render dynamic components without memoization.
  - Spot checks show similar patterns in tables/lists lacking `memo`, `useCallback`, and virtualization.

- **Unoptimized API usage**
  - React Query is adopted widely. However, multiple locations use polling via `setInterval` in UI layers instead of server-push: `TenantDashboardClient.tsx`, `DashboardClient.tsx`, `TenantNotificationDropdown.tsx`, `GlobalNotificationContext.tsx`, `useTenantAuditLogs.ts`, `useAuditLogs.ts`, backup pages. You have `useSocketIO` implemented but not consistently used as the exclusive update mechanism.
  - Some queries set `refetchOnWindowFocus: true` by default for dashboards, causing churn.
  - Several fetchers in components (`DynamicAnalyticsCharts.tsx`) bypass React Query (no caching/retries/staleTime).

- **Bundle size issues**
  - Good usage of `next/dynamic` for charts and Swagger UI. Heavy libraries left: FullCalendar is statically imported in `src/components/calendar/Calendar.tsx` causing large client bundle chunk. Consider dynamic import with `ssr:false` and on-demand plugins.
  - Excessive console logs across app inflate bundle and runtime noise; `next.config.ts` sets `removeConsole: false`.
  - Many `any` usages and large monolithic components prevent tree-shaking of component branches.

- **State management smells**
  - `TenantRolesClient.tsx` and `TenantSidebar.tsx` maintain broad local state; effects and memoized derivations could be split into smaller memoized subcomponents.
  - Contexts used for confirmations/notifications are fine, but context consumers re-render fully; introduce context selectors or split providers.
  - Redux `useSelector` with `any` and no selector memoization increases re-renders.

- **SEO/i18n/A11y gaps**
  - Mixed usage of `<Head>` inside App Router pages; prefer `export const metadata`/`generateMetadata`. Limited OpenGraph/Twitter tags; no JSON-LD.
  - No `sitemap.xml` and `robots.txt` detected.
  - No automatic `hreflang` alternates for i18n routes.
  - A11y is decent for buttons and images; ensure form controls have labels consistently.

- **Web Vitals risks**
  - LCP: Large client components and charts on first paint, frequent focus refetching.
  - CLS: Multiple dynamic lists/tables without fixed heights; images mostly via `next/image` (good). Skeletons used in many places (good).
  - FID/INP: Heavy synchronous logging, large bundles, and repeated list computations.

- **Other code health items**
  - Many `any` types across critical areas; reduces type-safety and optimization potential.
  - Large console/log noise in `TenantSidebar.tsx`, `api.ts`, auth/login pages.
  - No sitemap/robots integration; limited `next/script` usage is fine in `layout.tsx`.


#### 2) Performance Optimization (concrete recommendations)

- **Reduce re-renders**
  - Memoize handlers/expensive computations using `useCallback`/`useMemo`. Split large components into memoized subcomponents.
  - Use `React.memo` on list rows, table cells, and heavy child components.
  - Prefer context selectors (e.g., `use-context-selector`) or split contexts to reduce global re-renders.
  - Virtualize tables/lists with `react-window` or `@tanstack/react-virtual`.

- **Optimize API layer**
  - Use React Query for `DynamicAnalyticsCharts.tsx` and similar ad-hoc fetchers; define `staleTime`, `select`, `placeholderData`, `keepPreviousData`.
  - Replace polling `setInterval` with socket events via `useSocketIO` (already present). For fallback, use React Query `refetchInterval` with visibility checks.
  - Batch endpoints for dashboards; add server-level caching for aggregated data; add ETags/If-None-Match.
  - Ensure pagination and field `select` in Prisma everywhere (already used in many places—continue consistently).

- **Images**
  - Continue using `next/image`; add width/height for all images; use priority only for above-the-fold hero; leverage `sizes` attribute.

- **Dynamic imports**
  - Convert `src/components/calendar/Calendar.tsx` to dynamic import with `ssr:false` and lazy-load plugins.
  - Defer non-critical widgets using `next/dynamic` with `loading` placeholders.

- **Tree-shaking**
  - Set `compiler.removeConsole: { exclude: ['error', 'warn'] }` or remove logs in production.
  - Audit unused exports and dead code; enable bundle analyzer on demand.

- **DSA-inspired improvements**
  - Convert repeated `.includes/.some/.find` hot loops to `Set` lookups when comparing IDs or module keys.
  - Replace nested loops in permission filtering with `Map`/`Set`-based precomputation.
  - For large search lists, switch to debounced input (already partially used) and apply binary search or indexed structures where appropriate.
  - Offload heavy filtering/sorting to Web Workers for very large datasets.

- **Debounce/Throttle**
  - Apply `debounce` to search inputs and expensive filters in tables (use `src/lib/utils.ts` debounce/throttle).


#### 3) SEO & Web Best Practices

- Use `export const metadata` consistently; add `openGraph`, `twitter`, `alternates` for `hreflang`.
- Add JSON-LD for breadcrumbs and organization on landing pages.
- Add `app/sitemap.ts` and `app/robots.ts` to generate sitemap/robots.
- Ensure ARIA attributes and labels for all interactive elements; confirm color contrast.
- Lazy load non-critical components and third-party scripts with `next/script` strategies.


#### 4) Web Vitals

- LCP: Server Components for static/slow-changing parts; avoid blocking heavy client libs on first paint.
- INP/FID: Memoize handlers, reduce console/logging, use Web Workers for expensive calculations.
- CLS: Reserve space with fixed heights for images and charts; continue using skeletons.
- Prefetch: Use `PrefetchLink` or Next `<Link prefetch>` for key routes; your `src/lib/prefetch.tsx` is a good start—use it.


#### 5) Targeted code edits (before → after)

- **TenantSidebar: replace repeated includes/find with Set**
Before:
```ts
const hasAnyModulePermission = userPermissions.permissions?.some((permission: any) => 
  permission.moduleKey === moduleKey && (permission.canRead || permission.canCreate || permission.canUpdate || permission.canDelete)
);
```
After:
```ts
const permissionSet = useMemo(() => new Set(
  (userPermissions?.permissions || [])
    .filter((p: any) => p.canRead || p.canCreate || p.canUpdate || p.canDelete)
    .map((p: any) => p.moduleKey)
), [userPermissions]);
const hasAnyModulePermission = permissionSet.has(moduleKey);
```

- **DynamicAnalyticsCharts: use React Query and debounce range changes**
Before:
```ts
const fetchAnalyticsData = async () => { /* api.get */ }
useEffect(() => { if (currentTenantSlug) fetchAnalyticsData(); }, [currentTenantSlug, dateRange]);
```
After:
```ts
const { data, isLoading, error, refetch, isFetching } = useQuery({
  queryKey: ['analytics', currentTenantSlug, dateRange],
  queryFn: () => api.get(`/tenant/${currentTenantSlug}/analytics?range=${dateRange}`).then(r => r.data.data),
  staleTime: 60_000,
  keepPreviousData: true,
});
```

- **Calendar: dynamic import**
Before:
```ts
import FullCalendar from '@fullcalendar/react';
```
After:
```ts
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });
```
Also dynamically import dayGrid/timeGrid/interaction only when needed.

- **Remove excessive production logs**
Before:
```ts
console.log('🔍 Final navigation items:', navItems);
```
After:
```ts
if (process.env.NODE_ENV !== 'production') {
  console.log('nav items', navItems);
}
```
Or enable console removal in `next.config.ts`.

- **React Query refetching**
Set `refetchOnWindowFocus: false` for dashboard queries unless absolutely required; rely on sockets.


#### 6) Prioritized checklist

- **Critical**
  - Replace polling with `useSocketIO` where possible; fallback to React Query `refetchInterval` with `document.visibilityState` checks.
  - Convert FullCalendar to dynamic import; defer heavy charts below the fold; add Suspense boundaries.
  - Reduce console logging in production and/or enable `removeConsole` for production builds.
  - Standardize SEO metadata via `export const metadata` and add sitemap/robots.

- **Recommended**
  - Memoize handlers and split large components into memoized subcomponents.
  - Introduce Sets/Maps for frequent lookups in permissions and filters.
  - Use React Query in `DynamicAnalyticsCharts` and similar; add proper `staleTime/select`.
  - Virtualize large tables.
  - Add JSON-LD for key pages.

- **Nice-to-have**
  - Web Worker for heavy filtering/sorting.
  - Bundle analyzer pass and module-level code splitting for rarely used admin subpages.
  - Implement ETags and response caching for reports/analytics endpoints.


#### 7) Snippet: metadata example
```ts
export const metadata: Metadata = {
  title: 'Tenant Dashboard',
  description: 'Manage your tenant operations',
  openGraph: { title: 'Tenant Dashboard', url: 'https://example.com', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Tenant Dashboard' },
  alternates: { languages: { en: '/en', fr: '/fr' } },
};
```

```ts
// app/sitemap.ts
export default async function sitemap() {
  return [{ url: 'https://example.com', changefreq: 'daily', priority: 1.0 }];
}

// app/robots.ts
export default function robots() {
  return { rules: [{ userAgent: '*', allow: '/' }], sitemap: 'https://example.com/sitemap.xml' };
}
```

This report highlights concrete hotspots and implementation-ready fixes to achieve substantial performance and SEO gains.
