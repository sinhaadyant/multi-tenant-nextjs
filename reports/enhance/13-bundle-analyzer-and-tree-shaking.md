### 13 — Bundle Analyzer & Tree-shaking

Goal: Identify heavy bundles and improve tree-shaking to reduce JS.

Steps (Cursor prompts)
1) Enable analyzer
```
- Add ANALYZE support: in next.config.ts enable webpack-bundle-analyzer when process.env.ANALYZE === 'true'.
- Add script: "analyze": "ANALYZE=true next build".
```
2) Inspect bundles
```
- Run npm run analyze; identify top modules (FullCalendar, charts, swagger-ui, lodash-like).
```
3) Shrink imports
```
- Use named imports only; avoid wildcard imports.
- Replace utility libs with native APIs or per-method imports.
```
4) Tree-shake config
```
- Ensure package.json sideEffects is accurate.
- Keep dynamic imports for heavy, route-scoped modules.
- Remove dead code and dev-only branches.
```
Acceptance Criteria
- Initial route JS down 30–60% on heavy pages; analyzer shows smaller chunks.

Rollback
- Disable ANALYZE flag and revert changes if regressions occur.

Free Tooling Choices
- webpack-bundle-analyzer (free)
