### 12 — i18n & SEO Alternates

Goal: Improve multilingual experience and search discoverability.

Steps (Cursor prompts)
1) Tenant default locale
```
- Read tenant default locale and set it server-side; persist cookie.
```
2) Lazy load translations
```
- Split locale JSON per route/namespace; load on demand.
```
3) Hreflang
```
- Add metadata alternates for all supported locales per route.
```
Acceptance Criteria
- Correct default locale per tenant; hreflang tags present.

Free Tooling Choices
- next-i18next (free); Next metadata alternates (built-in)
