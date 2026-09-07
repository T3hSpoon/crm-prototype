---
phase: 01-pipeline-board-foundation
plan: 01
subsystem: scaffold
tags: [vite, react, typescript, tailwind, shadcn, tooling]

requires: []
provides:
  - Building, dev-server-runnable Vite 8 + React 19.2 + TypeScript 5.9.3 SPA scaffold
  - Tailwind v4 wired CSS-first (@tailwindcss/vite, no tailwind.config.js)
  - shadcn/ui initialized (Radix base, Nova preset) with button, dialog, select, input, label, and field (current replacement for the deprecated "form" registry item) components under src/components/ui/
  - Every Phase 1 runtime/dev dependency installed at RESEARCH.md-corrected versions (typescript@5.9.3, @dnd-kit/sortable@10.0.0 independent of @dnd-kit/core@6.3.1)
  - "@" -> ./src path alias wired in both vite.config.ts and tsconfig*.json
  - Local dev machine's Node.js upgraded to meet Vite 8's minimum
affects: [01-02-data-seam, 01-03, 01-04, all-later-phases-depend-on-this-scaffold]

actuals:
  tokens: 42000
  tasks: 3
  commits: 1

tech-stack:
  added:
    - vite@8.2.2
    - react@19.2.8 / react-dom@19.2.8
    - typescript@5.9.3 (pinned exact, not 7.0.2)
    - "@tanstack/react-table@9.2.3"
    - "@dnd-kit/core@6.3.1 + @dnd-kit/sortable@10.0.0 + @dnd-kit/utilities@3.2.2"
    - zustand@5.0.15
    - react-hook-form@7.86.0 + zod@4.4.3 + @hookform/resolvers@5.9.1
    - "@faker-js/faker@10.6.0"
    - date-fns@4.4.0
    - clsx + tailwind-merge
    - tailwindcss@4.3.3 + @tailwindcss/vite
    - shadcn/ui CLI (Radix base, Nova preset) — pulled in lucide-react, radix-ui, class-variance-authority, cn, tw-animate-css, @fontsource-variable/geist as registry-item dependencies
    - eslint + typescript-eslint + prettier + @vitejs/plugin-react (dev)
  patterns:
    - Tailwind v4 CSS-first entrypoint (@import "tailwindcss" in src/index.css, no tailwind.config.js)
    - shadcn/ui component source copied into src/components/ui/ (owned, not a dependency)
    - "@/*" path alias resolved identically in vite.config.ts (resolve.alias) and tsconfig.json/tsconfig.app.json (compilerOptions.paths)
    - Isolated-scaffold-then-merge pattern for running `npm create vite` into a non-empty repo root (see Deviations #1)

key-files:
  created:
    - package.json
    - package-lock.json
    - vite.config.ts
    - tsconfig.json / tsconfig.app.json / tsconfig.node.json
    - index.html
    - src/main.tsx / src/App.tsx / src/App.css / src/index.css
    - components.json
    - src/components/ui/button.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/select.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
    - src/components/ui/field.tsx
    - src/components/ui/separator.tsx (registry dependency of field)
    - src/lib/utils.ts
    - eslint.config.js
    - README.md
  modified: []

key-decisions:
  - "Node.js upgraded via winget (OpenJS.NodeJS.LTS) since nvm/nvm-windows was not present on the machine — installed v24.19.0, satisfying Vite 8's >=22.12.0 requirement"
  - "Scaffolded npm create vite in an isolated temp directory, then merged the generated files into the repo root, rather than running create-vite directly in the repo root — the repo root already contains .claude/ and .planning/, and create-vite's --overwrite flag (needed to bypass its non-empty-directory guard) would have deleted them"
  - "Used create-vite's --eslint flag (current create-vite@9.x defaults to Oxlint) since the plan's Task 3 explicitly installs eslint + typescript-eslint as dev dependencies, implying an ESLint-based template was intended"
  - "shadcn/ui init run with -b radix (CLAUDE.md states shadcn/ui is Radix-based) and -p nova (the CLI's recommended preset) — the plain `npx shadcn@latest init` command from RESEARCH.md's Code Examples no longer works non-interactively; the current CLI requires an explicit base-library and preset selection"
  - "Substituted the field component for form in the shadcn add command — the registry's form item is now an empty placeholder; the actual RHF+zod composition primitives (Field, FieldLabel, FieldError, etc.) live under field, exactly matching RESEARCH.md's own Code Examples and its State-of-the-Art warning to verify against what the CLI actually scaffolds"
  - "Allowed lucide-react to be installed (via shadcn's automatic registry-dependency install) despite RESEARCH.md's Task 3 instruction to defer it — confirmed by inspecting the live registry that both dialog (XIcon) and select (chevron icons) genuinely import from lucide-react in the current shadcn component source, so omitting it would break the build"
  - "Fixed vite.config.ts to use import.meta.dirname instead of __dirname (RESEARCH.md's cited pattern) after the build surfaced a forward-compat warning that __dirname is unsupported by Vite's upcoming native config loader default"
  - "Corrected the leftover 'vite-scaffold-tmp' project name in package.json (name field) and index.html (<title>) to idrive-crm-prototype / iDrive CRM Prototype, a byproduct of scaffolding in an isolated temp directory"

requirements-completed: [PIPE-01, PIPE-02, DEAL-01]

coverage:
  - id: D1
    description: "Local Node.js upgraded to meet Vite 8's minimum (>=20.19.0 or >=22.12.0)"
    requirement: ""
    verification:
      - kind: other
        ref: "node -e \"const [maj,min]=process.version.slice(1).split('.').map(Number); process.exit((maj>22)||(maj===22&&min>=12)||(maj===20&&min>=19)?0:1)\" (plan's exact Task 1 verify command)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Package legitimacy pre-install review (7 heuristic-SUS packages) reviewed and approved by human before any install ran"
    requirement: ""
    verification: []
    human_judgment: true
    rationale: "gate=\"blocking-human\" checkpoint — inherently a human trust decision (T-01-SC threat mitigation), not something that can auto-pass on a scripted check"
  - id: D3
    description: "Vite + React 19.2 + TypeScript 5.9.3 scaffold builds cleanly"
    requirement: "PIPE-01"
    verification:
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: false
  - id: D4
    description: "TypeScript pinned exactly to 5.9.3 (not the scaffold's default or CLAUDE.md's 7.0.2)"
    requirement: ""
    verification:
      - kind: other
        ref: "node -e \"process.exit(require('./package.json').devDependencies.typescript==='5.9.3'?0:1)\""
        status: pass
    human_judgment: false
  - id: D5
    description: "@dnd-kit/core@6.3.1 and @dnd-kit/sortable@10.0.0 installed as independently-versioned packages (not string-matched)"
    requirement: "PIPE-02"
    verification:
      - kind: other
        ref: "node -e check comparing package.json dependencies['@dnd-kit/core'] and ['@dnd-kit/sortable']"
        status: pass
    human_judgment: false
  - id: D6
    description: "Tailwind v4 wired CSS-first: src/index.css starts with @import \"tailwindcss\"; and no tailwind.config.js exists in the repo root"
    requirement: ""
    verification:
      - kind: other
        ref: "head -1 src/index.css; grep for @tailwind base/components/utilities; node -e fs.existsSync('tailwind.config.js') check"
        status: pass
    human_judgment: false
  - id: D7
    description: "npm run dev boots a working dev server with no console/server errors"
    requirement: "PIPE-01"
    verification:
      - kind: automated_ui
        ref: "Started `npm run dev -- --port 5183 --strictPort` in background; curl / returned HTTP 200; curl /src/main.tsx and /src/App.tsx returned HTTP 200; dev server log showed clean startup + one expected HMR reload, no errors; server stopped cleanly afterward"
        status: pass
    human_judgment: false
  - id: D8
    description: "shadcn/ui component source generated under src/components/ui/ for button, dialog, select, input, label, and the current form-equivalent (field)"
    requirement: "DEAL-01"
    verification:
      - kind: other
        ref: "ls src/components/ui/ — button.tsx, dialog.tsx, select.tsx, input.tsx, label.tsx, field.tsx, separator.tsx all present"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-09-07
status: complete
---

# Phase 01 Plan 01: Project Scaffold Summary

**Node.js upgraded past Vite 8's minimum, a human-approved package legitimacy review completed, and a building/dev-server-runnable Vite 8 + React 19.2 + TypeScript 5.9.3 project stood up with Tailwind v4 CSS-first styling and shadcn/ui's Radix-based component primitives (button, dialog, select, input, label, field) generated under `src/components/ui/` — every Phase 1 dependency pinned at RESEARCH.md's npm-registry-verified versions, ready for 01-02 to build the data seam on top of it.**

## Performance
- **Duration:** ~35min active execution (excludes time spent waiting for the Task 2 human approval)
- **Started:** 2026-09-07 (Task 1 Node version check)
- **Completed:** 2026-09-07T08:22:33Z (Task 3 commit)
- **Tasks:** 3 completed (Task 1 auto, Task 2 blocking-human checkpoint, Task 3 auto)
- **Files modified:** 27 files created (0 pre-existing files modified)

## Accomplishments
- Verified/upgraded the local dev machine's Node.js from v20.12.1 to v24.19.0 via winget, clearing Vite 8's hard minimum-version blocker before any scaffold command ran
- Obtained explicit human approval on the Task 2 package-legitimacy checkpoint (T-01-SC threat mitigation) before any `npm install` executed
- Stood up a clean, building, dev-server-verified Vite + React + TypeScript + Tailwind v4 + shadcn/ui scaffold with every Phase 1 dependency pinned at its RESEARCH.md-corrected version, handling several current-tooling drifts (create-vite's non-empty-directory guard, create-vite@9's Oxlint default, shadcn's new base/preset selection flow, and the `form`→`field` registry rename) that the plan's literal commands didn't anticipate

## Task Commits
1. **Task 1: Verify and upgrade Node.js to Vite 8's minimum** — no commit (environment-only, no repo files modified per plan's own `<files>` spec); upgrade method: winget (`OpenJS.NodeJS.LTS`), v20.12.1 → v24.19.0
2. **Task 2: Package legitimacy pre-install review** — `checkpoint:human-verify`, `gate="blocking-human"`; human responded "approved" verbatim, no packages flagged for re-investigation; no commit (no code change, decision only)
3. **Task 3: Scaffold Vite + React + TS, pin corrected stack versions, wire Tailwind v4 + shadcn/ui** - `506e110` (feat)

**Plan metadata:** committed separately (see below)

## Files Created/Modified
- `package.json` / `package-lock.json` — pinned dependency manifest at RESEARCH.md-corrected versions; project renamed from the scaffold-temp-dir default to `idrive-crm-prototype`
- `vite.config.ts` — `react()` + `tailwindcss()` plugins, `"@"` alias via `path.resolve(import.meta.dirname, "./src")`
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` — `"@/*"` path mapping added to the first two
- `index.html` — title corrected to "iDrive CRM Prototype"
- `src/index.css` — Tailwind v4 CSS-first entrypoint plus shadcn's Nova preset theme (CSS variables, `tw-animate-css`, Geist font import)
- `components.json` — shadcn/ui CLI configuration (`style: "radix-nova"`, `iconLibrary: "lucide"`)
- `src/components/ui/{button,dialog,select,input,label,field,separator}.tsx` — shadcn-generated component source (`field` is the current registry replacement for the now-empty `form` item; `separator` is a registry dependency of `field`)
- `src/lib/utils.ts` — re-exports `cn` from the `cn` package (current shadcn CLI's own `clsx`+`tailwind-merge` wrapper; `clsx`/`tailwind-merge` remain installed per the plan for direct use elsewhere)
- `src/main.tsx`, `src/App.tsx`, `src/App.css` — unmodified scaffold defaults, to be replaced by 01-02's `PipelineBoard`
- `eslint.config.js`, `README.md` — unmodified create-vite defaults (ESLint template)

## Decisions Made
See `key-decisions` in frontmatter above for the full list with rationale. Summary: upgraded Node via winget; scaffolded in an isolated temp directory and merged into the repo root to avoid deleting `.claude/`/`.planning/`; used `--eslint` on create-vite to match the plan's ESLint dev-dependency step; used shadcn's `-b radix -p nova` flags to get a non-interactive init matching CLAUDE.md's Radix-based description; substituted `field` for the now-empty `form` registry item; kept `lucide-react` since `dialog`/`select` genuinely import from it; fixed the `__dirname`→`import.meta.dirname` forward-compat warning; corrected the leftover temp-directory project name.

## Deviations from Plan

**1. [Rule 3 - Blocking] `npm create vite@latest .` cannot run directly in the repo root**
- **Found during:** Task 3
- **Issue:** The plan's literal action says "In the repo root, run `npm create vite@latest . -- --template react-ts`." The repo root already contains `.claude/` and `.planning/` (committed at base SHA `ac6c769`), so create-vite's non-empty-directory guard triggers an interactive "remove existing files and continue?" prompt. In a non-interactive shell this returns "Operation cancelled" with no files written. The only non-interactive bypass, `--overwrite`, deletes existing files in the target directory — unacceptable, since it would destroy `.claude/` and `.planning/`.
- **Fix:** Ran `npx create-vite@latest . --template react-ts --eslint --no-interactive` inside an isolated empty temp directory (under the session scratchpad), then copied the generated files (`README.md`, `eslint.config.js`, `index.html`, `package.json`, `public/`, `src/`, `tsconfig*.json`, `vite.config.ts`) into the repo root, leaving the existing `.gitignore` (already covers `node_modules/`, `dist/`, logs, env files), `.claude/`, `.planning/`, and `.git` untouched.
- **Files modified:** all Task 3 scaffold files (see Files Created/Modified above)
- **Verification:** `npm run build` and `npm run dev` both succeed post-merge; `git status` confirmed no pre-existing tracked file was overwritten or deleted
- **Committed in:** `506e110`

**2. [Rule 3 - Blocking] create-vite@9's default template uses Oxlint, not ESLint**
- **Found during:** Task 3
- **Issue:** Running `npm create vite@latest . -- --template react-ts` with no further flags now scaffolds an Oxlint-based project (`.oxlintrc.json`, `"lint": "oxlint"`) by default. The plan's Task 3 action explicitly installs `eslint typescript-eslint prettier @vitejs/plugin-react` as dev dependencies, implying an ESLint-based project was intended, and RESEARCH.md's Code Examples/Standard Stack table list `typescript-eslint` as part of the locked stack.
- **Fix:** Re-ran the scaffold with the `--eslint` flag, producing the standard `eslint.config.js` + `eslint`/`typescript-eslint`/`@eslint/js`/`eslint-plugin-react-hooks`/`eslint-plugin-react-refresh` devDependency set instead of Oxlint.
- **Files modified:** `eslint.config.js`, `package.json`
- **Verification:** `package.json` devDependencies contain `eslint`, `typescript-eslint`, no `oxlint`
- **Committed in:** `506e110`

**3. [Rule 3 - Blocking] `npx shadcn@latest init` (bare, as in RESEARCH.md's Code Examples) no longer completes non-interactively**
- **Found during:** Task 3
- **Issue:** The current shadcn CLI (`shadcn@4.21.0`) prompts interactively for "Select a component library" (Base UI / React Aria / Radix UI) and then "Which preset would you like to use?" (Nova/Vega/Maia/Lyra/Mira/Luma/Sera/Rhea/Custom) — neither prompt existed when RESEARCH.md's Code Examples were written, and `-y`/`--yes` (default `true` on `init`) does not skip them.
- **Fix:** Ran `npx shadcn@latest init --template vite -b radix -p nova -y`. Chose `-b radix` because CLAUDE.md's Technology Stack section explicitly describes shadcn/ui as "Radix-based" component primitives. Chose the `nova` preset (the CLI's own recommended/highlighted default) since the plan expressed no preference and RESEARCH.md predates this choice entirely.
- **Files modified:** `components.json` (`style: "radix-nova"`), `src/index.css` (Nova preset theme), `src/components/ui/button.tsx`, `src/lib/utils.ts`
- **Verification:** `components.json` written with `iconLibrary: "lucide"`, `style: "radix-nova"`; `npm run build` succeeds
- **Committed in:** `506e110`

**4. [Rule 3 - Blocking] The `form` shadcn registry item is now an empty placeholder; `field` is its replacement**
- **Found during:** Task 3
- **Issue:** The plan's Task 3 action runs `npx shadcn@latest add button dialog select input label form`. This produced no `form.tsx` file and no error — `npx shadcn@latest view form` confirms the registry item exists but has an empty `files` array. RESEARCH.md's own State-of-the-Art section had already flagged this exact risk: "current shadcn/ui pattern uses `Controller` + `Field`/`FieldLabel`/`FieldDescription`/`FieldError` composition... verify against what `npx shadcn@latest add form` actually scaffolds at execution time, since shadcn ships copied source, not a fixed API" — and RESEARCH.md's Code Examples for the add-deal form already use `Field`/`FieldLabel`/`FieldError`, not a `Form`-prefixed component.
- **Fix:** Ran `npx shadcn@latest add field -y -o` (the `-o`/`--overwrite` was needed because `field`'s registry dependency on `label` triggered an interactive overwrite prompt for the already-identical `label.tsx`, which `-y` alone did not suppress on the `add` subcommand — unlike `init`, `add`'s `-y` default is `false` and does not imply `-o`). This generated `src/components/ui/field.tsx` (`Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldContent`, `FieldTitle`) and its own registry dependency `src/components/ui/separator.tsx`.
- **Files modified:** `src/components/ui/field.tsx`, `src/components/ui/separator.tsx`, `src/components/ui/label.tsx` (re-written, content unchanged)
- **Verification:** `ls src/components/ui/` shows `field.tsx` and `separator.tsx` present; content matches RESEARCH.md's Code Examples composition (`Field`, `FieldLabel`, `FieldError`)
- **Committed in:** `506e110`

**5. [Rule 3 - Blocking] `lucide-react` is a genuine, unavoidable dependency of the `dialog` and `select` components, contradicting RESEARCH.md's "defer lucide-react" guidance**
- **Found during:** Task 3
- **Issue:** RESEARCH.md's Task 3 read_first and Package Legitimacy Audit both state "no Phase 1 component uses icons; defer" `lucide-react`. Before adding components, `npx shadcn@latest view dialog` and `npx shadcn@latest view select` were inspected directly against the live registry: `dialog.tsx` imports `XIcon` from `lucide-react` for its close button, and `select.tsx` imports lucide icons for its chevron/check indicators. Both are components this plan is required to add (D-03's modal form uses Dialog; D-02's stage selector and PIPE-02's stage-move dropdown use Select). Omitting `lucide-react` would break `npm run build` for any file that renders these components.
- **Fix:** Allowed `lucide-react` to install automatically as `shadcn@latest init`'s own registry-dependency resolution added it to `package.json` — no manual `npm install lucide-react` step was needed or added beyond what shadcn's tooling did itself.
- **Files modified:** `package.json` (`lucide-react` present as a dependency)
- **Verification:** `npm run build` succeeds with `dialog.tsx`/`select.tsx` present; `grep lucide-react` confirms only `dialog.tsx` and `select.tsx` import from it (button/input/label/field/separator do not)
- **Committed in:** `506e110`

**6. [Rule 1 - Bug/forward-compat fix] `vite.config.ts`'s `__dirname` usage triggers a Vite 8 deprecation warning**
- **Found during:** Task 3 (surfaced by the first `npm run build` acceptance-criteria check)
- **Issue:** `npm run build` succeeded but printed: "Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite: `__dirname` (vite.config.ts:11:25). Use `import.meta.dirname` instead." RESEARCH.md's own cited Code Example used `path.resolve(__dirname, "./src")`, sourced from ui.shadcn.com — the docs source predates this warning.
- **Fix:** Changed `vite.config.ts` to `path.resolve(import.meta.dirname, './src')`.
- **Files modified:** `vite.config.ts`
- **Verification:** Re-ran `npm run build` — warning gone, build still succeeds in 337ms
- **Committed in:** `506e110`

**7. [Rule 1 - Bug fix] Leftover temp-directory project name in `package.json` and `index.html`**
- **Found during:** Task 3, after the isolated-scaffold-then-merge (Deviation #1) left the scaffold's `name`/`<title>` fields set to the temp directory's basename (`vite-scaffold-tmp`)
- **Issue:** `package.json`'s `"name"` field and `index.html`'s `<title>` both read `vite-scaffold-tmp`, a side effect of scaffolding into an isolated temp directory (Deviation #1) rather than the actual project directory.
- **Fix:** Set `package.json` `"name"` to `idrive-crm-prototype` and `index.html` `<title>` to `iDrive CRM Prototype`.
- **Files modified:** `package.json`, `index.html`
- **Verification:** `curl` against the running dev server confirmed the updated `<title>` served correctly via HMR after the fix
- **Committed in:** `506e110`

---
**Total deviations:** 7 auto-fixed (5 Rule 3 - blocking, 2 Rule 1 - bug/forward-compat fix)
**Impact on plan:** All deviations were necessary to get a working, buildable scaffold out of current (2026-09-07) tooling that has moved past what RESEARCH.md's exact command sequences anticipated (create-vite's directory guard and Oxlint default, shadcn's base/preset selection and `form`→`field` rename, a Vite 8 config forward-compat warning). None changed the plan's architectural intent or its acceptance criteria — every criterion in the plan's `<acceptance_criteria>` and `<verification>` blocks passes as specified. No deviation required a Rule 4 (architectural) stop.

## Issues Encountered
None beyond the deviations documented above — no unresolved blockers.

## Authentication Gates
None encountered — no auth-gated commands were needed this plan (npm registry access, winget, and npx all succeeded without credentials).

## User Setup Required
None - no external service configuration required. (Task 2's checkpoint required human review/approval, not setup — already completed and documented as normal flow above, not a deviation.)

## Next Phase Readiness
The scaffold builds cleanly (`npm run build` exits 0), the dev server boots and serves correctly (`npm run dev`, verified via automated HTTP checks), Tailwind v4 is wired CSS-first with no `tailwind.config.js`, and all six required shadcn/ui primitives (button, dialog, select, input, label, and field as the current form-equivalent) exist under `src/components/ui/`. Every Phase 1 runtime dependency is installed at its RESEARCH.md-corrected version. 01-02 can now build the `DealsRepository` data seam, `shared/types/deal.ts`, the Zustand `pipelineStore`, and the `PipelineBoard`/`GroupSection`/`DealTable`/`AddDealDialog` components directly on top of this scaffold, per `research/ARCHITECTURE.md`'s recommended structure. No blockers identified for 01-02.

---
*Phase: 01-pipeline-board-foundation*
*Completed: 2026-09-07*
