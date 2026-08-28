# Stack Research

**Domain:** React frontend prototype — CRM sales-pipeline grouped table/board + forecast analytics, mock/local data only
**Researched:** 2026-08-28
**Confidence:** MEDIUM (all findings cross-checked across multiple current sources and verified directly against npm registry version metadata; no access to Context7/Exa in this session, so treat exact patch versions as "current as of research date, re-check before pinning in `package.json`")

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.2 (npm latest: 19.2.8) | UI runtime | Current stable major; React Compiler reached 1.0 (Oct 2025) and is production-ready, removing most manual `useMemo`/`useCallback` tuning. Chosen per PROJECT.md constraint to align with the likely stack of the existing iDrive project it will later merge into. |
| TypeScript | 7.0 (npm latest: 7.0.2) | Static typing | TS 7 is the native Go-ported compiler (GA July 2026), 8–12x faster type-checking with no source-level breaking changes for typical app code. Strongly recommended for a prototype that must later merge cleanly into another codebase — types double as living documentation of the mock data shape the real API will need to match. Caveat: TS 7.0 lacks a stable *programmatic* compiler API until 7.1 — irrelevant for `tsc`/editor use, but pin `typescript-eslint` to a version confirmed compatible before adopting. |
| Vite | 8 (npm latest: 8.2.2) | Build tool / dev server | Vite 8 (stable since March 2026) unified its bundler on Rolldown (Rust), delivering 10–30x faster builds than the old Rollup/esbuild split, with full plugin compatibility. Recommended over Next.js because this phase has zero backend/SSR/routing needs — a plain SPA dev server is the correct amount of tooling. If the existing iDrive project turns out to be Next.js-based, swap only this layer (see Stack Patterns by Variant); nothing else in this stack is Vite-specific. |
| @tanstack/react-table | 9 (npm latest: 9.2.3) | Headless table/grid logic | Purpose-built for exactly this UI: grouped rows (pipeline stage groups) with expandable sub-rows (line items per deal) via its native `getSubRows`/expanding APIs. It is headless (no imposed markup/CSS), which matters because PROJECT.md explicitly wants "own visual identity, not a monday.com clone" — you own every pixel while TanStack owns sorting/grouping/expansion state. Peer dep: `react >=18`. |
| @dnd-kit/core + @dnd-kit/sortable | 6 (npm latest: core 6.3.1) | Drag-and-drop between stage groups | The 2026 community-standard React DnD library (~2.8M weekly downloads vs react-beautiful-dnd's declining, now-frozen ~1.2M): small (~6KB core), accessible (keyboard + screen-reader drag support out of the box), actively maintained, and its `sortable` preset directly supports "drag a card from one grouped column to another," which is this project's core interaction. Peer dep: `react >=16.8.0`. |
| Recharts | 3 (npm latest: 3.10.1) | Forecast/analytics page charts | The pragmatic default for React dashboards: declarative JSX chart components, solid TypeScript types, covers the bar/line/area/pie chart types a pipeline-value + win-rate + projected-revenue forecast page needs, without the hand-rolled-D3 effort of visx or the extra bundle weight of Nivo. Peer dep now explicitly includes `^19.0.0`. |
| Zustand | 5 (npm latest: 5.0.15) | App/UI state (pipeline data, selected deal, filters) | ~1KB, hook-first, near-zero boilerplate — the right size for a single prototype app holding pipeline/board/forecast state in memory. Plain React Context is not a state-management solution (no selectors, re-renders the whole subtree) and Redux Toolkit's ceremony (~10KB, reducers/slices/devtools) only pays off past ~20 interdependent components, which this prototype won't reach before the real backend integration phase. |
| Tailwind CSS | 4 (npm latest: 4.3.3) | Styling | v4's CSS-first config (`@import "tailwindcss"` + `@theme` in CSS, no `tailwind.config.js` needed) plus its native Vite integration (`@tailwindcss/vite` plugin, no PostCSS setup) makes it the fastest path to a distinct visual identity without hand-writing a CSS architecture. |
| shadcn/ui | latest CLI (component-copy model, no single "version") | Base component primitives (buttons, dialogs, dropdowns, table shell) | Not a dependency — it's a generator that copies Radix-based, Tailwind-styled component *source* directly into your repo. You own and can restyle every component (critical for the "own visual identity, not a clone" requirement) with zero version-lock risk, which also de-risks the later merge into the existing iDrive project (no competing design-system dependency to reconcile). It is the default output of essentially every 2026 AI codegen tool, so it's a safe, idiomatic choice reviewers will recognize. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7 (npm latest: 7.86.0) | Form state for "add prospect/deal" and inline edit forms | Use for any form with more than 2-3 fields (the add-deal form, the line-item editor). Uncontrolled-first design keeps re-renders low even with a subitems array field (`useFieldArray`). |
| zod | 4 (npm latest: 4.4.3) | Schema validation + TypeScript type inference | Define one Zod schema per entity (Deal, LineItem, LostReason) — it becomes both your `react-hook-form` validation and your mock-data/API response shape, so the shape the real backend must return later is already specified. |
| @hookform/resolvers | 5 (npm latest: 5.9.1) | Bridges react-hook-form + zod | Install alongside the two above; use `zodResolver(schema)` in every `useForm()` call. |
| @faker-js/faker | 10 (npm latest: 10.6.0) | Generating realistic mock/seed data | Use to generate the initial seed dataset (prospect names, company names, deal values, SKUs) so the prototype demos with varied, realistic-looking data instead of "Deal 1, Deal 2, Deal 3." |
| date-fns | 4 (npm latest: 4.4.0) | Date math for close dates, forecast periods, "days in stage" | Use over native `Date` math or `moment` for anything involving date arithmetic in the forecast page (e.g., quarter bucketing, days-since-created). Tree-shakeable, unlike moment. |
| lucide-react | latest | Icons | shadcn/ui's default icon set; pull in only the icons you use (tree-shakeable) for stage badges, drag handles, the lost/won markers. |
| clsx + tailwind-merge | latest | Conditional className composition | Needed once you start conditionally styling stage-colored group headers/badges; this is the pairing shadcn/ui components already assume (`cn()` helper). |
| @dnd-kit/utilities, @dnd-kit/modifiers | matching @dnd-kit/core version | Constrain/transform drag behavior | Add when you need to restrict dragging to the vertical axis within a column, or snap dragged cards to a grid — not needed for a basic cross-group drag. |
| @tanstack/react-virtual | latest 3.x | Row virtualization | Only add if a pipeline group grows into the hundreds/thousands of rows and the grouped table starts to feel sluggish — not needed for prototype-scale seed data. |
| Mock Service Worker (msw) | 2 (npm latest: 2.15.0) | Network-level API mocking | **Optional, not core for this phase.** Use if you want the app to make real `fetch()` calls against intercepted mock endpoints (e.g., for Storybook, integration tests, or to hand a "contract" to a future backend team) rather than just reading an in-memory array. See Architecture note below for the default (simpler) approach. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| @vitejs/plugin-react | React fast-refresh + JSX transform for Vite | npm latest: 6.1.1. Standard companion to Vite; add `@tailwindcss/vite` alongside it for Tailwind v4. |
| ESLint + typescript-eslint | Linting | Confirm `typescript-eslint` has published a release compatible with TypeScript 7 before pinning; if not yet caught up, pin `typescript` to the latest 5.9.x line rather than blocking on tooling. |
| Prettier | Formatting | Standard, no notable 2026 changes. |
| Vitest | Unit/component tests | Not requested for this phase's scope, but pairs natively with Vite (shares config/transform pipeline) if/when tests are added later — prefer it over Jest to avoid a second build pipeline. |

## Installation

```bash
# Scaffold
npm create vite@latest crm-prototype -- --template react-ts
cd crm-prototype

# Core UI/data
npm install @tanstack/react-table @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities recharts zustand

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# Styling
npm install tailwindcss @tailwindcss/vite
npx shadcn@latest init   # then: npx shadcn@latest add button dialog dropdown-menu table badge

# Mock/seed data
npm install @faker-js/faker date-fns

# Dev dependencies (Vite scaffold already includes TS + @vitejs/plugin-react; add lint/format)
npm install -D eslint typescript-eslint prettier
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @tanstack/react-table (headless) | AG Grid (Community/Enterprise) | If the eventual production CRM needs enterprise data-grid features out of the box (pivoting, Excel export, server-side row model) — AG Grid ships those, but its Enterprise tier is paywalled and its default look fights the "own visual identity" requirement. Overkill for this prototype. |
| @dnd-kit | Atlassian pragmatic-drag-and-drop | If the board later needs to handle thousands of cards with zero animation overhead (Jira/Trello-scale performance) or drag targets outside the browser (file drops). Not a concern at prototype scale. |
| Zustand | Redux Toolkit (+ RTK Query) | If/when the real backend integration phase arrives and the team wants RTK Query's built-in caching/invalidation for server state, or the app grows past ~20 tightly-coupled stateful components. Revisit at that milestone, not now. |
| Recharts | visx (Airbnb, D3-based) | If the forecast page needs a genuinely custom, brand-specific chart type Recharts can't express — visx trades speed-to-build for full low-level control. |
| Recharts | Nivo | If richer out-of-the-box chart types (radar, sunburst, etc.) are wanted and the extra bundle size is acceptable. |
| Tailwind + shadcn/ui | Plain CSS Modules / styled-components | If the existing iDrive project already has an established styling convention discovered later — shadcn/ui components are plain React + `className`, so they re-skin easily, but confirm before investing heavily in Tailwind utility classes across the codebase. |
| In-memory repository (Promise-returning functions) | Mock Service Worker (MSW) | Use MSW instead once you want Storybook stories, integration tests, or a literal HTTP contract to hand to whoever builds the real backend — it's strictly more setup than needed for "get the UI working against mock data" alone. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| react-beautiful-dnd | Deprecated by Atlassian Oct 14 2024; GitHub repo archived (read-only) Aug 18 2025; no further feature work; React 19 compatibility unconfirmed. | @dnd-kit |
| Create React App (CRA) | No longer maintained/recommended; removed from the official React docs as a getting-started option; far slower dev server and stale tooling than Vite. | Vite |
| Redux (plain, without Toolkit) | Boilerplate-heavy (manual action types/creators) for no benefit Redux Toolkit doesn't already give you, if you were going to reach for Redux at all. | Zustand now; Redux Toolkit later if truly needed |
| moment.js | Unmaintained in effect ("legacy" per its own docs), not tree-shakeable, bloats bundle. | date-fns |
| A heavy pre-styled component library (MUI, Bootstrap, Ant Design) | Fights the explicit requirement to build "its own visual identity" distinct from monday.com — these ship strong opinionated look-and-feel that's expensive to override, and add a large dependency you'd have to reconcile against whatever the existing iDrive project already uses. | Tailwind CSS + shadcn/ui (unstyled-by-default, copied into your repo) |
| Next.js for this phase | Adds SSR/routing/server-component assumptions this frontend-only, no-backend prototype doesn't need, and risks conflicting with the eventual integration target's actual framework before that's even known. | Vite (React SPA) — revisit only if the existing iDrive project is confirmed to be Next.js-based |
| Building the mock-data swap as scattered `useState`/hardcoded arrays read directly in components | Makes the later real-API swap (explicit project requirement) a rewrite instead of a one-file change. | A small repository/service layer (e.g. `dealsRepository.getDeals(): Promise<Deal[]>`) that components/Zustand store call — swap the implementation, not the call sites, when the real API arrives |

## Stack Patterns by Variant

**If the existing iDrive project turns out to use Next.js (discovered at integration time):**
- Swap Vite → Next.js (App Router) as the build/routing layer.
- Everything else is unaffected: TanStack Table, dnd-kit, Recharts, Zustand, react-hook-form + zod, Tailwind + shadcn/ui are all framework-agnostic within React and are the same libraries Next.js projects use.

**If the existing iDrive project has an established design system already:**
- Keep shadcn/ui's *structural* components (dialog, dropdown, table shell — accessibility/behavior primitives via Radix) but drop Tailwind's utility classes in favor of the existing system's styling approach. Because shadcn output is plain source you own, this is a restyle, not a rewrite.

**If pipeline data volume grows well beyond prototype scale (hundreds+ rows per group) before the real backend arrives:**
- Add `@tanstack/react-virtual` on top of `@tanstack/react-table` for row virtualization; no other change needed.

**If the team wants Storybook or integration tests against the mock layer before the real backend exists:**
- Add MSW in front of the repository layer so the mocked calls look like real network requests (useful as a literal API contract handoff).

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| react@19.2.x | @tanstack/react-table@9.2.3 (peer `react >=18`) | OK |
| react@19.2.x | @dnd-kit/core@6.3.1 (peer `react >=16.8.0`) | OK |
| react@19.2.x | recharts@3.10.1 (peer includes `^19.0.0`) | OK — earlier Recharts 2.x majors did not list React 19 support |
| react@19.2.x | react-hook-form@7.86.0 (peer includes `^19`) | OK |
| vite@8.2.2 | @vitejs/plugin-react@6.1.1 | OK — Vite 8's Rolldown migration required a plugin-react bump; do not pin an older plugin-react against Vite 8 |
| vite@8.2.2 | tailwindcss@4.3.3 via @tailwindcss/vite | OK — Tailwind v4's Vite plugin path, not the old PostCSS config |
| typescript@7.0.x | typescript-eslint | **Verify before pinning** — TS 7's native compiler shipped without a stable programmatic API until 7.1; if your chosen `typescript-eslint` release hasn't caught up, pin `typescript@^5.9` instead (fully compatible with every other package above) rather than blocking on lint tooling |

## Sources

- npm registry (direct package metadata fetch, 2026-08-28): react, typescript, vite, @tanstack/react-table, @dnd-kit/core, recharts, zustand, react-hook-form, @hookform/resolvers, zod, tailwindcss, msw, @faker-js/faker, date-fns, @vitejs/plugin-react — version numbers and peer-dependency ranges (LOW individual-source confidence per source-hierarchy classification, but this is the authoritative registry itself, not a secondary claim about it)
- Web search, cross-checked across multiple independent 2026 articles (MEDIUM confidence): React 19.2/Compiler 1.0 status; Vite 8/Rolldown migration; TypeScript 7.0 native-compiler GA and its known API-stability caveat; dnd-kit vs pragmatic-drag-and-drop vs react-beautiful-dnd (including the Atlassian deprecation/archive timeline); Recharts vs visx vs Nivo tradeoffs; Zustand vs Redux Toolkit vs Context guidance; react-hook-form + Zod pairing; shadcn/ui's 2026 "component generator, not a library" positioning and AI-tooling default status; repository/adapter pattern for mock→real API swaps; feature-based React folder structure conventions
- Official docs referenced by search results: react.dev/versions, vite.dev/blog/announcing-vite8, devblogs.microsoft.com/typescript/announcing-typescript-7-0, github.com/atlassian/react-beautiful-dnd (deprecation notice), github.com/react-hook-form/resolvers

---
*Stack research for: React frontend CRM sales-pipeline prototype (mock data only)*
*Researched: 2026-08-28*
