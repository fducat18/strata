---
title: "Fix sidebar/menu flash on navigation (FOUC in dark mode)"
date: 2026-05-09
---

## Problem

Every click on the left sidebar nav causes a white flash, especially in dark mode.

**Root cause:** `MainLayout.astro` has a `<script>` tag at the bottom of `<body>` that uses ES `import` syntax:

```html
<script>
  import { initTheme } from '../lib/theme';
  initTheme();
</script>
```

Astro compiles any `<script>` with `import` into `<script type="module">`, which is **always deferred** — it runs *after* first paint. On every full-page navigation (Astro uses plain `<a href>` links → full page reloads):

1. New HTML arrives → body renders with **no `dark` class** on `<html>`
2. Tailwind dark styles don't apply → **white flash**
3. Deferred module script finally runs → `initTheme()` → `dark` class added → screen flips dark

This is a classic FOUC (Flash Of Unstyled Content) pattern.

---

## Fix

Add a small `is:inline` synchronous script **in `<head>`** — before any stylesheets — that reads `localStorage` and applies the `dark` class before any paint. The `is:inline` directive prevents Astro from bundling/converting the script, keeping it as a plain blocking `<script>` that runs during HTML parsing.

The existing body `<script>` is kept for the `system` media query listener.

### Inline script (raw JS, IIFE)

```html
<script is:inline>
  (function () {
    try {
      var t = localStorage.getItem('strata.theme') || 'system';
      var dark =
        t === 'dark' ||
        (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (dark) document.documentElement.classList.add('dark');
    } catch (e) {}
  })();
</script>
```

The `try/catch` prevents breakage when `localStorage` is blocked (private mode, Tauri sandboxing edge cases).

---

## Files Changed

| File | Change |
|---|---|
| `front/src/layouts/MainLayout.astro` | Added `<script is:inline>` at top of `<head>` before stylesheets |

---

## Execution Summary

**Commit:** see git log

### Actual changes
- One `<script is:inline>` block added to `<head>` in `MainLayout.astro`
- No other files modified

### Deviations from plan
None.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ⏭ skipped (not affected) |
| Backend e2e | ⏭ skipped (not affected) |
| Frontend unit | ✅ all tests passed |
| Frontend e2e | ⏭ skipped (visual timing — cannot be automated) |

### Key discoveries
- The `themeStore.ts` already calls `applyThemeToDom(initialTheme)` at module load time (line 52), which also applies the dark class during React hydration. The inline head script provides the earlier (pre-paint) application that the store cannot — they are complementary.
- `CARGO_MANIFEST_DIR` (Rust) and `is:inline` (Astro) are both "escape hatches" from their respective build systems for exactly this kind of low-level timing requirement.
