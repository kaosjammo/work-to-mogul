# Deploy Notes — Tycoon Empire (first web deployment)

A simple static web build of this React + TypeScript + Vite app for testing on
desktop and phone browsers. **No platform wrappers** (no Electron / Tauri /
Capacitor / Android / Steam), no backend, no auth, no analytics, no payments.

---

## Recommended host

**Vercel** — it auto-detects Vite, runs the build, and serves the static
`dist/` output from its global CDN. No server runtime is involved; this is a
pure static single-page app.

## Build command & output

| Setting | Value |
|---|---|
| **Framework preset** | Vite (auto-detected) |
| **Install command** | `npm install` (auto) |
| **Build command** | `npm run build` &nbsp;(= `tsc -b && vite build`) |
| **Output directory** | `dist` |
| **Node version** | Vercel default (Node 22.x) is fine; Vite 8 needs ≥ 20.19 |

The Vite config sets **no `base`** (defaults to `/`) and **no custom
`outDir`** (defaults to `dist`), so the defaults above are correct for a
root-domain Vercel deployment. Nothing needs changing.

## Environment variables

**None.** The game is 100% client-side: all state lives in memory and is
persisted to `localStorage` (`tycoon:save`). There is no backend, no API, and
no secret of any kind to configure.

## Steps to deploy from GitHub to Vercel

1. Commit the project (including the new `vercel.json` and this file) and push
   to a GitHub repo:
   ```bash
   git add vercel.json deploy-notes.md
   git commit -m "Add Vercel deploy config + notes"
   git push
   ```
   (`node_modules/` and `dist/` are already gitignored — Vercel builds from
   source, so do not commit them.)
2. Go to **vercel.com → Add New… → Project** and **Import** the GitHub repo
   (authorize Vercel for the repo if prompted).
3. On the configure screen, confirm the auto-detected settings:
   - Framework Preset: **Vite**
   - Build Command: **`npm run build`**
   - Output Directory: **`dist`**
   - Install Command: **`npm install`**
   - Environment Variables: **none**
4. Click **Deploy**. First build takes ~1–2 minutes.
5. Open the generated `*.vercel.app` URL on desktop and on your phone.
6. Every later push to the connected branch triggers an automatic redeploy.

## Commands run locally (validation)

```
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npm run test      # vitest run
```

These are the only scripts defined in `package.json` (plus `dev` and
`preview`, which are not part of validation).

## Validation results

All run on the current tree, all green:

| Command | Result |
|---|---|
| `npm run build` | ✅ Pass — `dist/index.html`, `dist/assets/index-*.css` (~17.5 kB), `dist/assets/index-*.js` (~322 kB / ~98 kB gzip). 131 modules transformed. |
| `npm run lint` | ✅ Pass — oxlint, no errors. |
| `npm run test` | ✅ Pass — **146 tests across 26 files**. |
| `dist/` output | ✅ 80 files: hashed JS/CSS bundle + `index.html` + `manifest.webmanifest` + `sw.js` + the full `public/assets/**` SVG tree, copied verbatim. Suitable for static hosting. |

Static-hosting sanity checks performed:
- `index.html` references assets with **root-absolute** paths
  (`/assets/index-*.js`, `/manifest.webmanifest`, `/assets/brand/app_icon.svg`)
  — all resolve at the domain root on Vercel.
- All art is loaded from stable `/assets/...` paths under `public/` (string
  URLs, not bundler imports), and every referenced file exists in `dist/`.
- No hardcoded `localhost` / `http(s)://` / API calls anywhere in `src/`.
- Locally previewable with `npm run preview` (serves `dist/` on
  http://localhost:4173) to smoke-test the production bundle before pushing.

## `vercel.json` (what was added and why)

A **single, minimal** rule:

```json
{
  "headers": [
    { "source": "/sw.js",
      "headers": [ { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" } ] }
  ]
}
```

**Why:** the app already ships a hand-rolled service worker (`public/sw.js`,
pre-existing — not added here). Serving `sw.js` with `no-cache` ensures the
browser always revalidates it, so when you redeploy during testing the updated
service worker is picked up promptly instead of being served stale from an
intermediary cache. This protects the **existing** PWA's update path; it does
not add or change any PWA behavior.

**No `rewrites` were added** — the app does **not** use client-side routing
(navigation is internal React/Zustand tab state, not URL routes), so every
real URL is just `/`. A refresh therefore never 404s, and a catch-all SPA
rewrite would be wrong here (it would mask genuine missing-asset 404s by
serving `index.html` with a 200). See "Known issues" for the nuance.

**No build/output overrides were added** — Vercel's Vite auto-detection already
produces the correct `npm run build` → `dist` pipeline.

## Known issues / notes

- **Not a deep-linkable SPA.** Because there's no router, the deployed app has
  exactly one route (`/`). Hitting an arbitrary unknown path (e.g. a typo'd
  `/foo`) returns Vercel's default 404 rather than the app. This is expected
  and harmless — the game never links to sub-paths. If client-side routes are
  added later, add `"rewrites": [{ "source": "/(.*)", "destination": "/" }]`.
- **Service worker caching (existing PWA).** `sw.js` uses network-first for
  navigations (so new deploys serve fresh HTML) and caches hashed JS/CSS
  cache-first (safe — filenames change per build). Art under `/assets/` is
  stale-while-revalidate. If you edit art at a stable path and want it to
  refresh immediately for returning users, bump the `CACHE` constant in
  `public/sw.js` (currently `tycoon-empire-v2`). A hard-refresh / "Clear site
  data" also resets it during testing.
- **Save data is per-browser / per-origin.** Progress is stored in
  `localStorage` and is **not** synced across devices. Testing on desktop and
  phone yields two independent save files. This is by design for a first
  deploy (no accounts/backend).
- **`maximum-scale=1.0, user-scalable=no`** is set in `index.html` to keep the
  game UI fixed on mobile (intentional for a game; it does disable pinch-zoom).

## What to test on a phone after deployment

1. **Loads & renders** on the phone browser (iOS Safari and/or Android Chrome);
   no blank screen, no console errors.
2. **Core loop:** tap to work a shift → earn cash → buy the first business →
   buy more → confirm a business **automates** and earns on its own.
3. **Tab navigation** (bottom nav): Business / Staff / Upgrades / Stats / Ascend
   reveal as you progress; switching tabs is smooth.
4. **Touch targets** are comfortable (44px+), and the layout fits within the
   safe area (no content under the notch / home indicator).
5. **Persistence:** earn some money, fully close the tab, reopen the URL →
   progress is restored, and an "away earnings / welcome back" credit appears
   if you have automated income.
6. **Offline / PWA (optional):** load once online, then enable airplane mode and
   reload — the app should still open (served by the service worker). On
   iOS/Android you can also "Add to Home Screen" and confirm it launches
   standalone with the app icon.
7. **Golden Deal:** once you have automated income, leave the Business tab open
   ~2 min and confirm the floating "⚡ Time Warp" deal appears and is tappable.
8. **Performance:** the idle loop should stay smooth and the battery/heat should
   be reasonable over a few minutes of play.
