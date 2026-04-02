

## Optimization Opportunities for echo)))location

After reviewing the codebase, here are actionable optimizations organized by impact:

---

### 1. Route-Level Code Splitting (High Impact)

Currently, all routes are eagerly imported in `App.tsx` — every component loads upfront even if the user only visits the main menu. Using `React.lazy` + `Suspense` would split the bundle so each route loads on demand.

**Files:** `src/App.tsx`
- Lazy-load: `ClassicGame`, `CustomGame`, `CustomMode`, `CustomStats`, `ClassicStats`, `Settings`, `Credits`, `Tutorial`, `ChapterSelect`
- Wrap `<Routes>` in `<Suspense>` with a minimal loading fallback

**Estimated impact:** 30-50% smaller initial bundle

---

### 2. Font Loading Optimization (Medium Impact)

`index.css` imports Google Fonts via a render-blocking `@import`. This delays first paint.

**Files:** `index.html`, `src/index.css`
- Move font loading to `<link rel="preload">` in `index.html`
- Add `font-display: swap` to avoid invisible text during load
- Remove `@import` from CSS

---

### 3. Memoize GameCanvas (Medium Impact)

`GameCanvas` re-renders on every parent state change (timer ticks, etc.) even when its props haven't changed. It renders SVG elements and multiple DOM nodes per ping.

**Files:** `src/components/GameCanvas.tsx`
- Wrap export with `React.memo`
- Memoize expensive derived values (ping markers, SVG lines) with `useMemo`

---

### 4. Audio Node Cleanup / Pooling (Low-Medium Impact)

Each ping creates 4+ oscillators and gain nodes (main + 3 echoes) that aren't explicitly disconnected after stopping. Over many pings, this can cause GC pressure.

**Files:** `src/lib/audio/engine.ts`
- Disconnect nodes in `onended` callbacks
- Consider an object pool for frequently created nodes

---

### 5. Reduce SVG Re-renders in GameCanvas (Low Impact)

Each ping's connecting line creates a full-size `<svg>` overlay. With many pings, this means multiple overlapping SVGs.

**Files:** `src/components/GameCanvas.tsx`
- Consolidate all connecting lines into a single `<svg>` element
- Move ping history rendering into the same SVG

---

### Summary

| Optimization | Impact | Effort |
|---|---|---|
| Route code splitting | High | Low |
| Font preloading | Medium | Low |
| Memoize GameCanvas | Medium | Low |
| Audio node cleanup | Low-Medium | Medium |
| Consolidate SVGs | Low | Medium |

Recommendations 1-3 are quick wins with the best effort-to-impact ratio. Items 4-5 are worth doing if users report audio glitches or canvas lag with many pings.

