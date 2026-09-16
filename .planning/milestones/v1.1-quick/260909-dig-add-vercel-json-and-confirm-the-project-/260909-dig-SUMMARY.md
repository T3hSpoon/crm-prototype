---
task: 260909-dig
title: Add vercel.json and confirm the project is static-hosting-ready
status: complete
subsystem: build/deploy config
tags: [vercel, deploy-config, vite, static-hosting]
key-files:
  created:
    - vercel.json
  modified: []
decisions:
  - "vercel.json declares buildCommand/outputDirectory/framework/rewrites only — no functions/routes/builds keys, since this is a pure static Vite SPA with no server code (per PROJECT.md frontend-only constraint)."
  - "Catch-all SPA rewrite (/(.*)  -> /index.html) added even though no client-side router is installed yet — a no-op today, future-proofing for when routing is added."
metrics:
  duration: ~5min
  completed: 2026-09-09
actuals:
  tokens: 1200
  tasks: 2
  commits: 1
---

# Quick Task 260909-dig: Add vercel.json and confirm the project is static-hosting-ready Summary

Added a `vercel.json` at the repo root configuring this project as a static Vercel deployment (Vite SPA build, no server/edge functions), and confirmed via grep sweep that nothing in `src/` would break static hosting.

## What was built

**Task 1 — `vercel.json`:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- `buildCommand: "npm run build"` matches the existing `package.json` `build` script (`tsc -b && vite build`).
- `outputDirectory: "dist"` matches Vite's default output dir (unconfigured/default in `vite.config.ts`).
- `framework: "vite"` tells Vercel to skip auto-detection.
- `rewrites` is a catch-all SPA rule (`/(.*)` -> `/index.html`) — currently a no-op since no client-side router (e.g. react-router) is installed and the app has only one route, but future-proofs for when one is added.
- No `functions`, `routes`, or `builds` key — this is a pure static site, no server code exists anywhere in the project.

Ran `npm run build` after adding the file: exited 0, produced `dist/index.html` at the root and a `dist/assets/` subfolder (JS/CSS/font chunks), matching `vercel.json`'s `outputDirectory: "dist"` expectation exactly.

**Task 2 — static-hosting compatibility check of `src/`:**

Grepped the `src/` tree for four categories of pattern that would break static hosting:

| Check | Pattern | Result |
|---|---|---|
| Node built-ins | `require('fs'\|'path')`, `from 'fs'\|'path'`, `__dirname`, `__filename` | Zero matches |
| Stray env access | `process.env` | Zero matches |
| Backend network calls | `fetch(`, `axios` | Zero matches |
| Hardcoded local URLs | `localhost` (case-insensitive) | Zero matches |

**Conclusion, stated explicitly: the codebase is static-hosting-compatible.** This is expected and confirmed, not assumed — per PROJECT.md, this phase is frontend-only (no API, no database, no auth), and `src/data/mock/mock-deals-repository.ts` is the in-memory mock data layer with no real network calls. There is nothing in `src/` that assumes a Node.js runtime, a backend server, or environment variables outside Vite's own `import.meta.env` mechanism.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npm run build` — exit 0. Output: `dist/index.html`, `dist/assets/*` (JS bundle, CSS, font chunks). One pre-existing warning (main JS chunk >500kB after minification) is unrelated to this task's scope (no code changes made to `src/`) and out of scope per the deviation rules' scope boundary.
- `vercel.json` is valid JSON with exactly the four required top-level keys: `buildCommand`, `outputDirectory`, `framework`, `rewrites`. No server/function keys present.
- Grep sweep re-run and confirmed zero matches across all four categories (Node built-ins, `process.env`, `fetch`/`axios`, `localhost`).
- No `vercel` CLI was installed or invoked at any point. No `.vercel/` directory or Vercel project link was created anywhere in the repo (confirmed via `git status` — only `vercel.json` is new/tracked from this task).

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: vercel.json (exists at repo root, confirmed via `test -f`)
- FOUND: commit 4ec0dc3 (feat(260909-dig): add vercel.json for static Vite SPA deployment) — verified in `git log`
- FOUND: dist/index.html and dist/assets/ (build output confirmed present and matching vercel.json's outputDirectory)
