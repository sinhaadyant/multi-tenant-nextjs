### 17 — DSA Optimizations & Web Workers

Goal: Reduce algorithmic hotspots and move heavy work off the main thread.

Steps (Cursor prompts)
1) Sets/Maps for lookups
```
- Replace repeated includes/some/find for permissions and ID lookups with precomputed Sets/Maps.
```
2) Indexed search
```
- For large lists, build a simple index (Map from prefix/token to IDs) or use Fuse.js (lazy-loaded) with debounce.
```
3) Web Workers
```
- Add a worker for heavy filtering/sorting; transfer only needed fields; postMessage results back.
```
Acceptance Criteria
- Noticeable drop in CPU time on large lists; UI stays responsive during heavy operations.

Rollback
- Keep synchronous code paths behind a feature flag.

Free Tooling Choices
- Native Web Workers; comlink (MIT) optional
