## Technical Audit and Optimization Plan

### Executive Summary
- Focus: secure analytics access, reduce DB load, prevent cache leaks across tenants, standardize logging, and implement rate limiting.
- Outcome: faster analytics, safer APIs, predictable infra costs, and better DX.

---

### Mandatory Fixes (High Priority)

1) Fix permission escalation in analytics API
- Issue: `analytics` endpoint grants full analytics/audit/report/notifications access if the user has any one of those permissions.
- File: `src/app/api/tenant/[tenantSlug]/analytics/route.ts`
- Problem lines: logic around `hasAnyAnalyticsPermission` then forcing all modules true.
- Risk: data exposure across modules; privilege escalation.
- Fix:
  - Remove the permissive override. Compute per-section flags strictly from role permissions.
  - Optionally add an explicit `analytics:view` permission to gate entire payload.

2) Disable public caching for authenticated APIs; add Vary headers
- Issue: `next.config.ts` sets `Cache-Control: public, max-age=300` on `/api/*`. Authenticated responses can be cached and served across tenants/users by a CDN or proxy.
- Risk: cross-tenant/user data leakage.
- Fix in `next.config.ts` headers():
  - For `/api/(.*)` set: `Cache-Control: private, max-age=0, no-store` for authenticated routes.
  - Add `Vary: Authorization, Cookie, X-Tenant`.
  - Keep static asset caching as-is.

3) Remove server-side console logs; use structured logger
- Files: `analytics/route.ts`, `src/lib/supportNotificationHelper.ts`, others.
- Risk: leaking PII, noisy logs, performance overhead.
- Fix: introduce a logger (e.g., pino/winston) with levels; disable verbose logs in production. Route logs through it.

4) Validate and constrain query params
- Issue: `range` param not validated; defaults are OK but allow unexpected values.
- Fix: use `zod` to validate and map to allowed set: `['1d','7d','30d','90d']`; fallback to `7d`.

5) Avoid per-day N+1 counting in analytics
- Issue: loops performing daily `count` queries (up to 7 per section) increase latency.
- Fix: switch to single grouped query (SQL DATE bucket) and aggregate in memory.

---

### Performance and Scalability Optimizations (Medium Priority)

6) Implement API rate limiting (tenant- and user-scoped)
- Goals: protect analytics, support, and notifications endpoints; bound burst traffic.
- Strategy: sliding window with Upstash (prod) and in-memory fallback (dev).

```ts
// src/middleware.ts (example using @upstash/ratelimit)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) : undefined;

const limiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 req/min per key
  analytics: true,
}) : null;

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isApi = pathname.startsWith('/api/tenant/') || pathname.startsWith('/api/superadmin/');
  if (!isApi || !limiter) return NextResponse.next();

  const tenantSlug = pathname.split('/')[3] || 'na';
  const userId = req.headers.get('x-user-id') || 'anon';
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const key = `rl:${tenantSlug}:${userId}:${ip}`;

  const { success, remaining, reset } = await limiter.limit(key);
  const res = success ? NextResponse.next() : NextResponse.json({
    success: false,
    message: 'Too many requests. Please slow down.'
  }, { status: 429 });

  res.headers.set('X-RateLimit-Limit', '60');
  res.headers.set('X-RateLimit-Remaining', String(remaining));
  res.headers.set('X-RateLimit-Reset', String(reset));
  return res;
}

export const config = { matcher: ['/api/:path*'] };
```

7) Add DB indexes and query shapes
- Index candidates: `user(tenantId)`, `user(createdAt)`, `user(lastLogin)`, `auditLog(tenantId, createdAt)`, `userRoles(userId)`, `permissions(roleId, moduleKey)`.
- Review Prisma schema to ensure composite indexes match analytics filters; add `@@index` where missing.

8) Batch and project minimal columns
- Always select only needed fields; you already project in several places—continue consistently.
- Use `createMany({ skipDuplicates: true })` where applicable.

9) Client data fetching via React Query
- Replace custom state in `useTenantAnalytics` with TanStack Query for caching, deduping, retries, and background refresh.

```ts
// src/hooks/useTenantAnalytics.ts (sketch)
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useTenantAnalytics(range: '1d'|'7d'|'30d'|'90d' = '7d') {
  const { tenant, isLoggedIn } = useReduxAuth();
  return useQuery({
    queryKey: ['analytics', tenant?.slug, range],
    queryFn: async () => {
      const { data } = await api.get(`/tenant/${tenant!.slug}/analytics?range=${range}`);
      if (!data?.success) throw new Error(data?.message || 'Failed');
      return data.data;
    },
    enabled: Boolean(isLoggedIn && tenant?.slug),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: (prev) => prev,
    select: (d) => d, // project if needed
  });
}
```

10) Server response caching and ETags (where safe)
- For non-authenticated, idempotent endpoints: add `ETag` and `If-None-Match` handling to return `304`.
- For tenant-authenticated endpoints: prefer short-lived, private caches or no-store; rely on client-side caching.

11) Replace random analytics with real aggregates
- `generateDeviceAnalytics`, `generateSupportTickets`, `generateNotifications` currently mock random values.
- Implement proper aggregates from real tables; or clearly gate mocks to non-production only.

---

### Security, Reliability, and Observability (Medium Priority)

12) Structured logging
- Introduce a logger with JSON output in production (pino), requestId correlation, and log levels controlled by env.

13) Input hardening and error boundaries
- Validate all inputs with `zod`; add API-level and UI-level error boundaries and fallbacks.

14) Timezone and clock skew handling
- Normalize to UTC in DB queries; ensure date ranges are inclusive and DST-safe.

---

### Edge Cases to Cover
- Large tenants with millions of rows: ensure groupBy queries and indexes handle 90d ranges within SLOs.
- Tenants with no data: return zeros and empty arrays consistently.
- Deleted users/tenants mid-request: handle `null` gracefully and return 404/410 as appropriate.
- Permission changes during session: cache bust or revalidate permissions on sensitive endpoints.
- CDN/proxy behavior: confirm `Vary` headers to avoid cache poisoning.

---

### Step-by-Step Implementation Plan (Major ➜ Minor)

1) Security and correctness
- Remove analytics permission escalation; require explicit permissions per section.
- Update API caching headers to `private, no-store` and add `Vary: Authorization, Cookie, X-Tenant`.
- Add `zod` validation for analytics query params.

2) Load reduction and speed
- Implement rate limiting middleware (tenant+user scoped).
- Convert per-day loop counts to grouped queries; add indexes.
- Replace random metrics with real aggregates (or dev-only mock guards).

3) Client fetching and UX
- Migrate `useTenantAnalytics` to React Query; set sensible `staleTime`, retries, and placeholderData.
- Preload analytics on navigation where possible; use Suspense where appropriate.

4) Logging and observability
- Add pino-based logging with requestId; remove console logs from server code.
- Emit latency and query count metrics per endpoint.

5) Hardening and polish
- Add comprehensive tests for permissions and caching headers.
- Document rate limits and response headers in Swagger and Postman collection.

---

### SQL/Prisma Aggregation Sketches

```ts
// Example: daily counts via groupBy (Postgres/MySQL 8+)
const rows = await prisma.auditLog.groupBy({
  by: ['tenantId'],
  where: { tenantId, createdAt: { gte: startDate, lte: endDate } },
  _count: { _all: true },
});

// For true date buckets, use $queryRaw with DATE(createdAt) as bucket where supported
```

---

### API Headers Example (Authenticated routes)

```ts
return new Response(JSON.stringify(payload), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'private, no-store',
    'Vary': 'Authorization, Cookie, X-Tenant',
  },
});
```

---

### Dependencies to Add
- `@upstash/ratelimit` and `@upstash/redis` (prod), in-memory fallback (dev).
- `pino` (logger) and optional `pino-http`.
- `zod` (already present) for runtime validation.

---

### Success Criteria
- P95 analytics API latency < 300ms for 7d range on medium tenants.
- 0 cache leaks across tenants/users; verified via Vary headers.
- Clean server logs; no console noise in prod.
- Rate-limited endpoints return 429 with headers.
- React Query dedupes requests; no duplicate network calls on tab focus.
