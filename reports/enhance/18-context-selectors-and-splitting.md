### 18 — Context Selectors & Provider Splitting

Goal: Reduce global re-renders due to broad context updates.

Steps (Cursor prompts)
1) Introduce context selectors
```
- Replace useContext with use-context-selector for large contexts (Theme/Sidebar/Notifications).
- Consume only the needed slices.
```
2) Split providers
```
- Separate read-heavy from write-heavy values into different contexts to limit updates.
```
3) Memoize context values
```
- Ensure context value objects are memoized to stable identity.
```
Acceptance Criteria
- Subtrees re-render only when their slice changes; profiler shows fewer renders.

Rollback
- Revert to standard contexts if complexity outweighs gains.

Free Tooling Choices
- use-context-selector (MIT) or custom selector hooks (free)
