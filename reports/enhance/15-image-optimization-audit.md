### 15 — Image Optimization Audit

Goal: Minimize image bytes and layout shifts.

Steps (Cursor prompts)
1) next/image best practices
```
- Ensure width/height set; add sizes per breakpoint; use priority only for hero.
- Prefer AVIF/WebP; verify next.config images.formats includes them.
```
2) Responsive strategy
```
- Add proper sizes on all responsive images; audit sidebar/header avatars.
- Use blurDataURL for LCP images.
```
3) CDN
```
- If using a CDN, configure domains/remotePatterns; preconnect where helpful.
```
Acceptance Criteria
- Lighthouse media savings; zero unexpected CLS from images.

Rollback
- Revert sizes/priority changes if regressions appear.

Free Tooling Choices
- Next Image (built-in); AVIF/WebP encoders via Next (free)
