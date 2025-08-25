### 04 — React Query Standardization

Goal: Unify data fetching, caching, and refetching behaviors; minimize polling.

Scope: All data hooks and components using ad-hoc axios/api calls.

Steps (Cursor prompts)
1) Convert ad-hoc fetching to React Query
```
- Update DynamicAnalyticsCharts.tsx to use useQuery with staleTime, keepPreviousData, select.
- Add error and loading states from query.
```
2) Remove setInterval polling in UI
```
- Replace setInterval patterns with socket events via useSocketIO.
- For fallback, set refetchInterval in React Query conditioned on document.visibilityState === 'visible'.
```
3) Global defaults
```
- In Providers.tsx QueryClient, set sensible defaults (staleTime, retry, gcTime).
- Add query cancellation on unmount where applicable.
```
Acceptance Criteria
- No direct setInterval polling for data refresh.
- Queries share consistent behavior and cache keys.

Rollback
- Keep previous manual fetch as backup behind a feature flag.

Free Tooling Choices
- TanStack Query (free)
- Native Page Visibility API for conditional refetch (free)
