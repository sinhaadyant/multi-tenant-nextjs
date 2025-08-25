### 07 — SEO: Metadata, Sitemap, Robots, JSON-LD

Goal: Standardize SEO across routes and add sitemaps and robots directives.

Steps (Cursor prompts)
1) Metadata API everywhere
```
- Replace <Head> with export const metadata on App Router pages.
- Add openGraph, twitter, alternates (hreflang).
```
2) Sitemaps & robots
```
- Add app/sitemap.ts dynamic generator.
- Add app/robots.ts with allow + sitemap link.
```
3) Structured data
```
- Add JSON-LD (Organization/BreadcrumbList) to landing and key list pages.
```
Acceptance Criteria
- Lighthouse SEO passes; metadata consistent; sitemap/robots respond.

Rollback
- Keep previous <Head> usage temporarily.

Free Tooling Choices
- Next metadata API, sitemap.ts, robots.ts (built-in)
