---
phase: 260909-dig-add-vercel-json-and-confirm-the-project-
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - vercel.json
autonomous: true

must_haves:
  truths:
    - "A vercel.json file exists at the repo root configuring this as a static Vite SPA build (npm run build -> dist/), with no server/edge functions declared."
    - "A catch-all rewrite sends every path to /index.html, future-proofing for client-side routing (currently a no-op since the app has only one route)."
    - "npm run build still passes cleanly after vercel.json is added, and the dist/ output matches what vercel.json's outputDirectory expects (index.html at dist/ root, assets/ subfolder)."
    - "No code in src/ would break static hosting on Vercel — no Node built-ins (fs, path, __dirname), no process.env usage beyond Vite's own import.meta.env, no fetch/axios calls to a backend, no hardcoded localhost URLs. This is confirmed and stated explicitly in SUMMARY.md, not silently assumed."
  artifacts:
    - vercel.json
  key_links:
    - "vercel.json buildCommand 'npm run build' -> package.json 'build' script ('tsc -b && vite build') -> Vite's default dist/ output"
    - "vercel.json outputDirectory 'dist' -> Vite's default build.outDir (unconfigured in vite.config.ts, defaults to dist/)"
---

<objective>
Add a `vercel.json` at the repo root configuring this project for a static Vercel deployment (Vite SPA, `npm run build` -> `dist/`, no server code), and confirm nothing in `src/` would break static hosting.

Purpose: The project is a frontend-only prototype (per PROJECT.md constraints — no API, no database, no auth, mock/seed data in-memory). It needs deploy-ready static hosting config so it can be demoed on Vercel without any server-side assumptions creeping in.
Output: `vercel.json` at repo root; a SUMMARY.md documenting the static-hosting compatibility check results.

**Explicitly out of scope — do NOT do any of the following:** do not install the `vercel` CLI, do not run `vercel` in any form (`vercel`, `vercel deploy`, `vercel dev`, etc.), do not create a Vercel account or Vercel project, do not attempt a live deploy. This task is purely local repo configuration.
</objective>

<execution_context>
@C:/gh-repos/eld/.claude/gsd-core/workflows/execute-plan.md
@C:/gh-repos/eld/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@C:/gh-repos/eld/.planning/STATE.md
@C:/gh-repos/eld/.claude/CLAUDE.md
@C:/gh-repos/eld/package.json
@C:/gh-repos/eld/vite.config.ts

Notes:
- `package.json`'s `build` script is `tsc -b && vite build`. `vite.config.ts` does not set `build.outDir`, so Vite's default output directory (`dist/`) applies. A prior `dist/` build already exists at the repo root with `index.html`, `favicon.svg`, `icons.svg`, and an `assets/` subfolder (JS/CSS/font chunks) — that shape is what `vercel.json`'s `outputDirectory: "dist"` must match.
- No `vercel.json` exists yet anywhere in the repo.
- No client-side router (e.g. react-router) is installed — this is currently a single-route SPA. The rewrite rule below is a future-proofing no-op today, not a fix for an existing routing bug.
- Per PROJECT.md constraints, this phase is frontend-only: no API calls, no database, no auth. `src/data/mock/mock-deals-repository.ts` is the in-memory mock data layer; there is no real network layer to worry about breaking under static hosting.
- A prior grep of `src/` for `process.env`, `__dirname`, `require('fs'|'path')`, `from 'fs'|'path'`, `fetch(`, `axios`, and `localhost` returned zero matches — the codebase is already static-hosting-clean. Task 2 below re-confirms this and records it in SUMMARY.md as a stated conclusion, not a silent skip.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create vercel.json for static Vite SPA deployment</name>
  <files>vercel.json</files>
  <action>
    Create `vercel.json` at the repo root (same level as `package.json`) with exactly these top-level keys: `buildCommand` set to `"npm run build"` (matches the `build` script already in `package.json`, which runs `tsc -b && vite build`); `outputDirectory` set to `"dist"` (Vite's default output dir, unconfigured/default in `vite.config.ts`, and matches the existing `dist/` folder shape with `index.html` at its root); `framework` set to `"vite"` (tells Vercel to skip auto-detection and use Vite-appropriate defaults); and `rewrites` set to an array containing one object: `{ "source": "/(.*)", "destination": "/index.html" }` — a catch-all SPA rewrite so any path resolves to `index.html` client-side. This app currently has only one route (no react-router installed), so the rewrite is a safe no-op today and future-proofs for client-side routing later. Do not add a `functions`, `routes`, `builds`, or any server/edge-function key — this is a pure static site, no server code exists anywhere in the project per PROJECT.md's frontend-only constraint. Do not run any `vercel` CLI command, do not install the `vercel` package, and do not create a Vercel account or project — this task only writes the local config file.
  </action>
  <verify>
    <automated>npm run build && test -f vercel.json && test -f dist/index.html && test -d dist/assets</automated>
  </verify>
  <done>`vercel.json` exists at the repo root with `buildCommand: "npm run build"`, `outputDirectory: "dist"`, `framework: "vite"`, and a `rewrites` array with the catch-all SPA rule. `npm run build` completes with zero errors and produces `dist/index.html` plus a `dist/assets/` folder, matching the `outputDirectory` value in `vercel.json`. No `vercel` CLI was installed or invoked.</done>
</task>

<task type="auto">
  <name>Task 2: Confirm src/ has no static-hosting incompatibilities</name>
  <files>(none — read-only verification; findings recorded in SUMMARY.md)</files>
  <action>
    Grep the `src/` tree for patterns that would break static hosting on Vercel: Node built-ins (`fs`, `path` imports, `__dirname`/`__filename` usage), `process.env` usage other than Vite's own `import.meta.env` mechanism, `fetch(` or `axios` calls targeting a backend, and hardcoded `localhost` URLs. This project is frontend-only per PROJECT.md (mock/seed data held in-app, no API/database/auth), so the expected result is zero matches. Whatever the actual result, record it explicitly in `SUMMARY.md` — if genuinely nothing incompatible is found, state that plainly (e.g. "Grepped src/ for Node built-ins, process.env, fetch/axios, and localhost references — zero matches; codebase is static-hosting-compatible as expected for a frontend-only mock-data prototype") rather than omitting the check or leaving it implicit.
  </action>
  <verify>
    <automated>! grep -rE "require\(['\"](fs|path)['\"]|from ['\"](fs|path)['\"]|__dirname|__filename" src/ && ! grep -rE "process\.env" src/ && ! grep -rE "fetch\(|axios" src/ && ! grep -ri "localhost" src/</automated>
  </verify>
  <done>Grep confirms zero occurrences of Node built-ins, `process.env`, `fetch`/`axios` calls, and `localhost` references anywhere in `src/`. SUMMARY.md explicitly states this finding (or documents any exceptions found, with a call on whether each one is actually a static-hosting problem).</done>
</task>

</tasks>

<verification>
Run `npm run build` — the project's only configured build check. Confirm it exits 0 and `dist/` contains `index.html` at its root plus an `assets/` subfolder, matching `vercel.json`'s `outputDirectory: "dist"`. Confirm `vercel.json` is valid JSON with the four required keys (`buildCommand`, `outputDirectory`, `framework`, `rewrites`) and no server/function keys. Re-run the Task 2 grep sweep over `src/` and confirm zero matches for Node built-ins, stray `process.env`, `fetch`/`axios`, and `localhost`. Confirm no `vercel` CLI process was run and no `.vercel/` directory or Vercel project link was created anywhere in the repo.
</verification>

<success_criteria>
- `vercel.json` exists at the repo root with `buildCommand`, `outputDirectory`, `framework`, and a catch-all `rewrites` entry, correctly matching this project's actual build output (`npm run build` -> `dist/`).
- `npm run build` passes with zero errors after `vercel.json` is added.
- SUMMARY.md explicitly documents the src/ static-hosting compatibility check and its result.
- No `vercel` CLI was installed, run, or used to deploy or create a project — purely local config.
</success_criteria>

<output>
Create `.planning/quick/260909-dig-add-vercel-json-and-confirm-the-project-/260909-dig-SUMMARY.md` when done.
</output>
