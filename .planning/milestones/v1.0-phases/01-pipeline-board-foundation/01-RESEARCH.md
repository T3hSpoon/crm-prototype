# Phase 1: Pipeline Board Foundation - Research

**Researched:** 2026-08-28
**Domain:** React 19 + Vite 8 SPA scaffold; headless grouped table (TanStack Table v9) over fixed pipeline-stage sections; modal form (react-hook-form 7 + zod 4) writing through a Zustand 5 store to a mock repository seam; stage-move interaction (dropdown vs. `@dnd-kit` v6)
**Confidence:** MEDIUM-HIGH (stack versions and breaking-change gotchas verified directly against npm registry and official docs this session; architecture/pitfalls/features are inherited as settled from prior project research per CONTEXT.md and not re-derived)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Add-Deal Form Scope**
- **D-01:** Add-deal form is a full intake: Name, Company, Value, Owner, and Close Date are all required to create a deal — no partial/minimal-add path. — **Reversibility:** reversible — purely a form-validation rule change, no data model impact.
- **D-02:** The form includes a stage selector — the user picks which of the five groups the new deal starts in, rather than always defaulting to Prospect. Supports entering a deal that's already mid-negotiation, not just brand-new leads.
- **D-03:** The form is a modal/dialog triggered by an "Add Deal" button (not an inline row-in-group or a slide-over panel).
- **D-04:** On submit, the deal appears in its selected group immediately and the modal closes (no batch-add/keep-open mode).

### Claude's Discretion

The user chose to discuss only "Add-deal form scope" this round. The following gray areas were presented but not discussed — Claude/researcher/planner have discretion, informed by the research already on file (see Canonical References):
- **Stage-move interaction** (drag-and-drop vs. dropdown/menu action per row) — `research/FEATURES.md` notes a status-dropdown is functionally equivalent to drag-drop for a grouped table and needs no dnd library for v1, while the project's tech stack already includes `@dnd-kit` for this interaction. Either is acceptable for Phase 1; pick based on effort vs. polish trade-off, and it's fine to ship the simpler mechanism first and layer drag-and-drop on later without changing the underlying `moveStage` data operation.
- **Seed data profile** (mock deal count, realism, distribution across the five groups) — no constraint given; use enough varied deals per group to make each group non-empty and the demo convincing (`@faker-js/faker` is already in the stack for this).
- **Pipeline row content** (which fields show on a deal row before Phase 2 adds the detail drawer/line items) — no constraint given; `research/FEATURES.md` suggests name/company, value, owner, close date, and stage as the baseline row fields, with group-level count/value totals in each section header.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. No scope-creep suggestions came up.

### Canonical References (must be read before planning/implementing)

- `.planning/PROJECT.md` — core value, active requirements, out-of-scope list, and locked key decisions
- `.planning/REQUIREMENTS.md` — full requirement IDs and traceability to phases
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and dependencies
- `.planning/research/ARCHITECTURE.md` — repository-pattern data seam, `src/` folder structure, Zustand store pattern, forecast-as-derived-selector pattern (settled, not re-derived by this document)
- `.planning/research/PITFALLS.md` — mock data shape, `pipelineStage`/`outcome` split, id-based updates, CSS scoping (settled, not re-derived by this document)
- `.planning/research/FEATURES.md` — MVP feature list and complexity notes (settled, not re-derived by this document)
- `.claude/CLAUDE.md` (Technology Stack section) — locked stack and versions (corrections to two entries are documented in this research's Standard Stack section)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| PIPE-01 | User can view deals grouped by pipeline stage (Prospect, Lead, Opportunity, Deal/Won, Lost) | Architecture Patterns Pattern 1 (5 pre-partitioned `useReactTable` instances, not `getGroupedRowModel`) and Pattern 2 (derived `PipelineGroup` from `pipelineStage`+`outcome`) directly implement the 5-group view; Code Examples provide the `usePipelineGroups` selector shape |
| PIPE-02 | User can move a deal from one pipeline stage to another | Architecture Patterns Pattern 3 (dropdown recommended for Phase 1, `@dnd-kit` classic-API fast-follow documented with a verified official example) and the `moveStage` Zustand action in Code Examples |
| DEAL-01 | User can add a new prospect/deal via a form | Code Examples (react-hook-form + zod + shadcn Dialog pattern, `addDeal` Zustand action); Standard Stack confirms all required library versions; Package Legitimacy Audit clears every package this form depends on |
</phase_requirements>

## Summary

Phase 1 is this project's Walking Skeleton: a working `npm create vite` scaffold, wired through Tailwind v4 + shadcn/ui, rendering a grouped pipeline table from mock seed data, with one real write path (add-deal) and one real state-transition path (move-stage) both flowing through the `DealsRepository` seam and a Zustand store — exactly the architecture already locked in `research/ARCHITECTURE.md`. Nothing here revisits that architecture; this research fills the layer below it: the exact scaffold command sequence, which TanStack Table v9 API actually fits "5 fixed named groups" (not `getGroupedRowModel`, which is built for dynamic column-value grouping), which `@dnd-kit` package/API generation matches the pinned version (there are two incompatible dnd-kit doc sets live right now — this matters), and a concrete Zustand store shape for `addDeal`/`moveStage`.

Two version-verification findings materially change what CLAUDE.md's stack table implies and must be corrected before scaffolding: (1) the local dev machine's Node.js (**v20.12.1**) is below Vite 8's minimum (**20.19+ or 22.12+**) — this blocks `npm create vite` today and must be resolved first; (2) `typescript-eslint`'s latest release (`8.68.0`) caps its `typescript` peer range at `<6.1.0`, so it cannot lint against the CLAUDE.md-recommended TypeScript 7.0.2 — CLAUDE.md already flags this as a caveat, and this research confirms it's not resolved, so the scaffold must pin `typescript@5.9.3`, not `7.0.2`, unless ESLint/typescript-eslint is dropped for this phase.

**Primary recommendation:** Scaffold with `typescript@5.9.3` (not 7.0.2) once Node is upgraded to 20.19+/22.12+; render the 5 pipeline groups as 5 pre-partitioned row sets (not TanStack's `getGroupedRowModel`) each backed by its own lightweight `useReactTable` instance sharing one `columns` array; ship the stage-move interaction as a per-row `<Select>` calling `moveStage(dealId, group)` for Phase 1 (drag-and-drop is a same-store, same-action fast-follow using the already-locked `@dnd-kit/core` + `@dnd-kit/sortable`, but adds real multi-container drag complexity this MVP phase doesn't need yet); split the deal's persisted status into `pipelineStage` (funnel position) + `outcome` (open/won/lost) per `research/PITFALLS.md` Pitfall 3, with a small derived selector computing which of the 5 UI groups a deal currently belongs to.

## Architectural Responsibility Map

This phase is 100% frontend, no backend tier exists yet — every capability below lives in the Browser/Client tier; the "Database/Storage" row is the in-memory mock repository standing in for a future real backend.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Grouped pipeline table rendering | Browser / Client | — | Pure React render over client state; no server involved in this prototype |
| Add-deal modal form (validation, submit) | Browser / Client | — | react-hook-form + zod run entirely client-side; "submit" writes to the mock repository, not a network call |
| Stage-move interaction (dropdown or drag) | Browser / Client | — | State transition happens in the Zustand store, applied in-memory |
| Deal + seed data persistence | Database / Storage (mocked) | Browser / Client | `MockDealsRepository` is an in-memory array standing in for the tier a real API/DB will occupy post-integration (out of scope this milestone) |
| Data access seam (`DealsRepository`) | API / Backend (mocked) | Browser / Client | Represents the future API boundary today as a same-process TypeScript interface; this is the tier that gets a real implementation later, per `research/ARCHITECTURE.md` |

**Planner note:** Because there is no backend tier this phase, watch for accidental "server-side" language creeping into task descriptions (e.g., "API endpoint for add-deal") — there is no endpoint, only a repository method call.

## Standard Stack

Versions below are re-verified against the npm registry this session (2026-08-28) — all match CLAUDE.md/`research/STACK.md` except where flagged.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react / react-dom | 19.2.8 [VERIFIED: npm registry] | UI runtime | Matches CLAUDE.md; confirmed current on npm this session |
| vite | 8.2.2 [VERIFIED: npm registry] | Build tool / dev server | Matches CLAUDE.md; **requires Node 20.19+ or 22.12+** [CITED: vite.dev/guide] — see Environment Availability, this blocks the local machine today |
| typescript | **5.9.3**, not 7.0.2 [VERIFIED: npm registry] | Static typing | CLAUDE.md recommends 7.0.2 but flags an unresolved `typescript-eslint` compatibility caveat; this session confirms the caveat is still live (see Common Pitfalls #1) — pin 5.9.3 for this phase |
| @tanstack/react-table | 9.2.3 [VERIFIED: npm registry] | Headless table/grid logic | Matches CLAUDE.md. **Not used via `getGroupedRowModel` for the 5 stage groups** — see Architecture Patterns |
| @dnd-kit/core | 6.3.1 [VERIFIED: npm registry] | Drag-and-drop primitives | Matches CLAUDE.md. Classic/"Legacy" API generation — see Common Pitfalls #2 for the version-pairing gotcha |
| @dnd-kit/sortable | **10.0.0**, not "matching core version" [VERIFIED: npm registry] | Sortable preset | CLAUDE.md says "matching @dnd-kit/core version" — this is incorrect; `@dnd-kit/sortable`'s own semver line is at major 10, paired release-for-release with core's 6.3.1. Install `@dnd-kit/sortable@10.0.0` alongside `@dnd-kit/core@6.3.1`, not a 6.x sortable (no such version exists on the classic line past early 2022) |
| @dnd-kit/utilities | 3.2.2 [VERIFIED: npm registry] | Drag transform helpers | Matches CLAUDE.md |
| zustand | 5.0.15 [VERIFIED: npm registry] | Client state store | Matches CLAUDE.md |
| tailwindcss / @tailwindcss/vite | 4.3.3 [VERIFIED: npm registry] | Styling / Vite plugin | Matches CLAUDE.md; v4 is CSS-first config, no `tailwind.config.js` — see Code Examples |
| shadcn/ui | latest CLI, no pinned version [CITED: ui.shadcn.com/docs/installation/vite] | Base component primitives | CLI confirmed to support the Tailwind v4 + Vite plugin path (`@import "tailwindcss"`, no PostCSS) |

### Supporting (this phase's actual usage)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.86.0 [VERIFIED: npm registry] | Add-deal modal form state | Required per D-01 (5 required fields) |
| zod | 4.4.3 [VERIFIED: npm registry] | Add-deal form schema/validation | One schema = both RHF validation and the `NewDealInput` type |
| @hookform/resolvers | 5.9.1 [VERIFIED: npm registry] | `zodResolver` bridge | Wire into every `useForm()` this phase creates |
| @faker-js/faker | 10.6.0 [VERIFIED: npm registry] | Seed data generation | Generates the initial deal list across all 5 groups |
| @vitejs/plugin-react | 6.1.1 [VERIFIED: npm registry] | Vite React plugin | Required companion to Vite 8's Rolldown-based config |
| date-fns | 4.4.0 [VERIFIED: npm registry] | Close-date formatting/parsing | Row rendering + form default values |
| clsx / tailwind-merge | 2.1.1 / 3.6.0 [VERIFIED: npm registry] | className composition | shadcn/ui's `cn()` helper depends on both |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-row `<Select>` stage-move (Phase 1 recommendation) | `@dnd-kit` cross-container sortable | dnd-kit is already a locked dependency and gives a more "monday.com-like" feel, but its correct multi-container implementation (`onDragOver` moving items between arrays, `onDragEnd` finalizing order, collision detection, `DragOverlay`) is materially more code and more edge cases (empty-group drop targets, keyboard/a11y drag) than an MVP walking-skeleton phase needs. See Pattern 3 below — recommended as the Phase 2+ fast-follow, not Phase 1. |
| 5 separate `useReactTable` instances, one per stage group | Single `useReactTable` instance + `getGroupedRowModel` | `getGroupedRowModel` groups by a **column's value** dynamically (e.g., user clicks "group by owner") — it is not designed for a fixed, always-5, named-section layout with independent add/move actions per section. Forcing it here fights the API; see Architecture Patterns Pattern 1. |
| No client-side router yet | `react-router` | CLAUDE.md/`research/STACK.md` do not list a router at all. Phase 1 has exactly one view (the pipeline board); Phase 4 adds a second (`/forecast`). Recommend deferring router installation to Phase 4 rather than adding routing infrastructure a single-view phase doesn't need — see Open Questions. |

**Installation (Phase 1 scope only):**
```bash
npm create vite@latest . -- --template react-ts
npm install typescript@5.9.3 --save-exact   # override the scaffold's default TS version — see Common Pitfalls #1

npm install @tanstack/react-table @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities zustand
npm install react-hook-form zod @hookform/resolvers
npm install tailwindcss @tailwindcss/vite
npx shadcn@latest init
npx shadcn@latest add button dialog select input label form
npm install @faker-js/faker date-fns
npm install clsx tailwind-merge

npm install -D eslint typescript-eslint prettier @vitejs/plugin-react @types/node
```

**Version verification:** All versions above were checked via `npm view <pkg> version` against the live npm registry on 2026-08-28 (see Package Legitimacy Audit for full signal set). Two corrections to CLAUDE.md/`research/STACK.md` are called out explicitly above (TypeScript pin, `@dnd-kit/sortable` version) — reconcile these when the plan references the stack table.

## Package Legitimacy Audit

Ran `package-legitimacy check` against the npm registry for every package this phase installs. Several long-established, extremely high-download packages were flagged `SUS` purely because their **latest published version** landed within the tool's "too-new" window — not because the package itself is new. First-publish dates (via `npm view <pkg> time.created`) confirm all of these are 4+ year old, actively maintained, high-trust packages (all repo URLs resolve to their well-known official GitHub orgs). Per protocol, `SUS` verdicts are still kept-with-checkpoint below; the audit table documents why each one is a low-risk false positive.

| Package | Registry | First Published | Weekly Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----------------|-------------------|--------------|---------|-------------|
| react | npm | (established, pre-2024) | 173.8M/wk | github.com/react/react | OK | Approved |
| react-dom | npm | (established) | 162.7M/wk | github.com/react/react | OK | Approved |
| typescript | npm | (established) | 275.9M/wk | github.com/microsoft/TypeScript | OK | Approved |
| vite | npm | 2020-04-21 | 175.9M/wk | github.com/vitejs/vite | SUS ("too-new": latest version published 2026-08-20) | Approved — false positive, 6-yr-old package, checkpoint optional but included per protocol |
| @tanstack/react-table | npm | 2022-01-19 | 19.9M/wk | github.com/TanStack/table | SUS ("too-new": latest version published 2026-08-26) | Approved — false positive, same pattern |
| @dnd-kit/core | npm | (established) | 24.6M/wk | github.com/clauderic/dnd-kit | OK | Approved |
| @dnd-kit/sortable | npm | (established) | 24.1M/wk | github.com/clauderic/dnd-kit | OK | Approved |
| @dnd-kit/utilities | npm | (established) | 24.6M/wk | github.com/clauderic/dnd-kit | OK | Approved |
| zustand | npm | 2019-04-09 | 54.1M/wk | github.com/pmndrs/zustand | SUS ("too-new": latest version published 2026-08-13) | Approved — false positive, 7-yr-old package |
| react-hook-form | npm | 2019-03-20 | 60.4M/wk | github.com/react-hook-form/react-hook-form | SUS ("too-new": latest version published 2026-08-21) | Approved — false positive, 7-yr-old package |
| zod | npm | (established) | 275.4M/wk | github.com/colinhacks/zod | OK | Approved |
| @hookform/resolvers | npm | 2020-05-20 | 50.8M/wk | github.com/react-hook-form/resolvers | SUS ("too-new": latest version published 2026-08-17) | Approved — false positive, 6-yr-old package |
| @faker-js/faker | npm | 2022-01-10 | 18.5M/wk | github.com/faker-js/faker | SUS ("too-new": latest version published 2026-08-14) | Approved — false positive, 4-yr-old package |
| date-fns | npm | (established) | 101.6M/wk | github.com/date-fns/date-fns | OK | Approved |
| tailwindcss / @tailwindcss/vite | npm | (established) | 127.3M / 46.5M per wk | github.com/tailwindlabs/tailwindcss | OK | Approved |
| @vitejs/plugin-react | npm | 2021-09-20 | 84.6M/wk | github.com/vitejs/vite-plugin-react | SUS ("too-new": latest version published 2026-08-28, same day as this research) | Approved — false positive, 5-yr-old package |
| lucide-react | npm | 2020-10-19 | 98.7M/wk | github.com/lucide-icons/lucide | SUS ("too-new") | Approved — false positive; **not actually required for Phase 1** (no icons used in this phase's UI), defer install |
| clsx | npm | (established) | 122.9M/wk | github.com/lukeed/clsx | OK | Approved |
| tailwind-merge | npm | (established) | 84.0M/wk | github.com/dcastil/tailwind-merge | OK | Approved |

**Packages removed due to `[SLOP]` verdict:** none.
**Packages flagged as suspicious `[SUS]`:** `vite`, `@tanstack/react-table`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `@faker-js/faker`, `@vitejs/plugin-react`, `lucide-react` — all are heuristic false positives (see table); the planner should still insert a lightweight `checkpoint:human-verify` before the install step per protocol, but it can be a fast rubber-stamp given the evidence above rather than a deep investigation.

*No `postinstall` scripts were found on any package in this list (`npm view <pkg> scripts.postinstall` returned empty for all).*

## Architecture Patterns

> Base architecture (repository seam, feature folders, Zustand pattern) is settled in `research/ARCHITECTURE.md` and not re-derived here. What follows is Phase 1-specific: how to actually implement the grouped table and stage-move given that settled architecture.

### System Architecture Diagram (Phase 1 slice)

```
┌─────────────────────────────────────────────────────────────────┐
│  App shell (main.tsx / App.tsx) — mounts PipelineBoard directly  │
│  (no router this phase — see Open Questions)                     │
└───────────────────────────┬───────────────────────────────────────┘
                             │ on mount: usePipelineStore().load()
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ PipelineBoard                                                     │
│   ├── "Add Deal" button → opens <AddDealDialog>                   │
│   └── 5x <GroupSection stage={...}>                                │
│         ├── header: label + count + Σvalue (derived, not stored)  │
│         └── <DealTable> — its own useReactTable(rows=groupDeals)  │
│               each row: name/company/value/owner/closeDate        │
│               + <Select> stage-move control (Phase 1 mechanism)   │
└───────────────────────────┬───────────────────────────────────────┘
      user submits form      │ user picks new group from <Select>
      addDeal(input)         │ moveStage(dealId, group)
             ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│ usePipelineStore (Zustand)                                        │
│   deals: Deal[]                                                   │
│   addDeal(input)   → dealsRepository.create(input)  → set(deals)  │
│   moveStage(id, g) → dealsRepository.moveStage(id,g) → set(deals) │
└───────────────────────────┬───────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ MockDealsRepository (in-memory array, seeded via @faker-js/faker) │
└─────────────────────────────────────────────────────────────────┘
```

A reader can trace both interactions end to end: form submit / select change → store action → repository method → new store state → both the originating group and the destination group re-render from the same `deals` array (no group is a separate copy of data).

### Recommended Project Structure (Phase 1 subset of `research/ARCHITECTURE.md`'s full structure)

```
src/
├── app/
│   └── App.tsx                          # mounts PipelineBoard; no router yet
├── features/pipeline/
│   ├── components/
│   │   ├── PipelineBoard.tsx
│   │   ├── GroupSection.tsx             # one per stage; renders its own DealTable
│   │   ├── DealTable.tsx                # wraps useReactTable for one group's rows
│   │   ├── StageSelect.tsx              # Phase 1 stage-move control
│   │   └── AddDealDialog.tsx            # shadcn Dialog + RHF + zod form
│   ├── hooks/
│   │   └── usePipelineGroups.ts         # selector: deals[] -> Record<PipelineGroup, Deal[]>
│   └── store/
│       └── pipelineStore.ts             # Zustand: deals, load, addDeal, moveStage
├── data/
│   ├── deals-repository.ts              # DealsRepository interface (per ARCHITECTURE.md)
│   └── mock/
│       ├── mock-deals-repository.ts
│       └── seed-data.ts                 # @faker-js/faker generated seed set
└── shared/types/
    └── deal.ts                          # Deal, PipelineStage, DealOutcome, PipelineGroup
```

### Pattern 1: Pre-Partition by Fixed Stage, Don't Use `getGroupedRowModel`

**What:** TanStack Table v9's grouping feature (`groupingState` + `getGroupedRowModel()`) groups rows by the **value of a column** and is built for the case where grouping is dynamic (e.g., a user picks "group by owner" from a menu, or the table groups by whatever column is configured). It is not designed to render a fixed, always-present set of 5 named sections, each independently receiving new rows (add) and losing/gaining rows (move) from outside the table's own state.
**When to use instead:** Compute `Record<PipelineGroup, Deal[]>` once (a plain `Array.filter`/`groupBy` selector, per `research/ARCHITECTURE.md` Pattern 3's "derived data via selectors"), then give each of the 5 `<GroupSection>` components its own lightweight `useReactTable({ data: groupDeals, columns })` call, sharing one `columns` definition. Each instance only needs base row model (`getCoreRowModel()`) for Phase 1 — sorting/filtering (Phase 4, PIPE-05/06) can be added per-instance later without touching the grouping logic at all, since grouping was never TanStack's job here.
**Trade-offs:** 5 small table instances instead of 1 is slightly more setup, but it sidesteps fighting an API not built for this shape, and it's what makes Phase 4's "sort by column" and "filter by owner" requirements trivial to add per-section later (each section already owns its own table instance and row model).

**Example (row-model guidance):**
```typescript
// Source: https://tanstack.com/table/latest/docs/framework/react/guide/grouping (CITED)
// "The feature is designed for dynamic column-based grouping... skip the
//  grouping feature entirely and pass pre-structured data" when groups are fixed.

// hooks/usePipelineGroups.ts
const GROUPS: PipelineGroup[] = ["prospect", "lead", "opportunity", "deal", "lost"];

export function usePipelineGroups() {
  const deals = usePipelineStore((s) => s.deals);
  return useMemo(() => {
    const byGroup = Object.fromEntries(GROUPS.map((g) => [g, [] as Deal[]])) as
      Record<PipelineGroup, Deal[]>;
    for (const deal of deals) byGroup[toPipelineGroup(deal)].push(deal);
    return byGroup;
  }, [deals]);
}
```

### Pattern 2: Split `pipelineStage` from `outcome`, Derive the 5 UI Groups

**What:** Per `research/PITFALLS.md` Pitfall 3 (cited as critical for this phase in CONTEXT.md), do not model status as one flat field mixing funnel position and terminal state. Use two fields on `Deal`: `pipelineStage: "prospect" | "lead" | "opportunity" | "deal"` (funnel position, 4 values, matches PROJECT.md's locked pipeline order) and `outcome: "open" | "won" | "lost"`. The 5 UI groups (`Prospect`, `Lead`, `Opportunity`, `Deal/Won`, `Lost`) are a **derived** `PipelineGroup` computed from the pair, not a 5th stored enum:
- `outcome === "lost"` → group is `"lost"`, regardless of `pipelineStage`
- otherwise → group is `pipelineStage` (i.e., `"deal"` pipelineStage IS the "Deal/Won" UI group for Phase 1, since Phase 3 hasn't introduced an explicit won-transition yet)

**When to use:** This is the field split CONTEXT.md's canonical references require before Phase 3 (lost-reason gating, explicit won transition) can be added without a data-model rework — get it right now even though Phase 1's UI never surfaces `outcome` directly.
**Trade-offs:** One extra field + one selector function vs. a single flat `stage` field — negligible cost now, and it's exactly what Pitfall 3 flags as expensive to retrofit later (a lost deal needs to retain the `pipelineStage` it was lost from; a flat field loses that history the moment it's overwritten with `"lost"`).

**Example:**
```typescript
// shared/types/deal.ts
export type PipelineStage = "prospect" | "lead" | "opportunity" | "deal";
export type DealOutcome = "open" | "won" | "lost";
export type PipelineGroup = "prospect" | "lead" | "opportunity" | "deal" | "lost";

export interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  owner: string;
  closeDate: string; // ISO 8601
  pipelineStage: PipelineStage;
  outcome: DealOutcome;
  lostReason?: string; // unused in Phase 1 UI; field exists so Phase 3 needs no migration
  createdAt: string;
}

// shared/utils/pipeline-group.ts — the derivation, used by both the table and the store
export function toPipelineGroup(deal: Deal): PipelineGroup {
  return deal.outcome === "lost" ? "lost" : deal.pipelineStage;
}

// The reverse mapping the Add-Deal form's stage selector and the Stage-move
// <Select> both need, going from a picked UI group back to the two stored fields:
export function fromPipelineGroup(group: PipelineGroup, previousStage?: PipelineStage) {
  if (group === "lost") {
    // Preserve prior pipelineStage per Pitfall 3; if there is none (brand-new
    // deal added directly as Lost), default to "prospect" — see Open Questions.
    return { pipelineStage: previousStage ?? "prospect", outcome: "lost" as const };
  }
  return { pipelineStage: group, outcome: "open" as const };
}
```

### Pattern 3: Dropdown Stage-Move for Phase 1; `@dnd-kit` as a Same-Store Fast-Follow

**What:** Implement stage-move as a `<Select>` per row (shadcn/ui `Select`) whose `onValueChange` calls `usePipelineStore().moveStage(dealId, group)`. This is the CONTEXT.md-sanctioned "ship the simpler mechanism first" path.
**When to use `@dnd-kit` instead (Phase 2+):** Once the dropdown's `moveStage` action exists and is proven, adding drag-and-drop is additive, not a rewrite — `@dnd-kit`'s `onDragOver`/`onDragEnd` handlers call the exact same `moveStage(dealId, group)` action, just triggered by a drop instead of a select change (per `research/ARCHITECTURE.md`'s data-flow diagram, the store action is the seam regardless of which UI triggers it).
**Trade-offs:** A correct multi-container `@dnd-kit` implementation needs: a `DndContext` wrapping all 5 groups, one `SortableContext` per group, `useSortable` per row, an `onDragOver` handler that moves the dragged id between the source and destination group's local id arrays (for live visual feedback while dragging), and an `onDragEnd` that commits the final group to the store — plus empty-group drop-target handling and keyboard/a11y support `@dnd-kit` provides but still must be wired. This is meaningfully more code than a `<Select>` for no functional gain in an `mvp`-mode phase whose 3 success criteria only require that a move *happens*, not that it happens via drag.
**Version-pairing gotcha:** There are currently two live, incompatible dnd-kit doc/API generations — see Common Pitfalls #2. The example below matches the **classic** `@dnd-kit/core@6.3.1` + `@dnd-kit/sortable@10.0.0` API pinned in this project's stack, sourced from the actual official example file, not the newer `@dnd-kit/react` docs.

**Example (for the Phase 2+ fast-follow, classic dnd-kit API):**
```typescript
// Source: github.com/clauderic/dnd-kit stories/2 - Presets/Sortable/MultipleContainers.tsx (CITED, classic/"Legacy" API — matches @dnd-kit/core@6.3.1)
import { DndContext, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';

<DndContext
  onDragOver={({ active, over }) => {
    const from = findGroup(active.id);
    const to = findGroup(over?.id);
    if (from !== to) {
      // live-move the dragged id into the hovered group's local array
      // (visual only — moveStage() is not called until onDragEnd)
    }
  }}
  onDragEnd={({ active, over }) => {
    const to = findGroup(over?.id);
    usePipelineStore.getState().moveStage(active.id as string, to);
  }}
>
  {GROUPS.map((group) => (
    <SortableContext key={group} items={groupDeals[group].map((d) => d.id)}>
      {/* rows */}
    </SortableContext>
  ))}
</DndContext>
```

### Anti-Patterns to Avoid
- **Using `getGroupedRowModel` for the 5 fixed groups:** Fights the API (built for dynamic column grouping); use Pattern 1 instead.
- **Flat `stage` field mixing funnel + terminal state:** Already an established anti-pattern per `research/PITFALLS.md` Pitfall 3 and `research/ARCHITECTURE.md` — use Pattern 2's split.
- **Mixing classic and next-gen `@dnd-kit` APIs:** Copying an example from `dndkit.com/react/...` (next-gen, `@dnd-kit/react`, `DragDropProvider`) against the pinned `@dnd-kit/core`/`@dnd-kit/sortable` classic packages will not compile — see Common Pitfalls #2.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation + error display for the 5-field add-deal form | Manual `useState` per field + manual error strings | react-hook-form + zod + `@hookform/resolvers` | Already locked in the stack; hand-rolling loses type inference between the schema and `NewDealInput`, and loses RHF's uncontrolled-input performance characteristics for no benefit |
| Stable id generation for new mock deals | Sequential counter or array index | `crypto.randomUUID()` (built into modern browsers/Node) or `faker.string.uuid()` for seed data | `research/PITFALLS.md` Pitfall 1/5: array-index or counter-based ids break the moment deals are grouped/filtered/reordered, which happens immediately in this phase (5 groups) |
| Modal/dialog accessibility (focus trap, ESC to close, overlay) | Custom `<div>` + manual keydown listeners | shadcn/ui `Dialog` (Radix primitive under the hood) | Radix's Dialog already handles focus trapping, ARIA attributes, and portal rendering correctly; hand-rolling this is a well-known source of subtle a11y bugs |
| className conditional logic for stage-colored badges/headers | String concatenation / template literals | `clsx` + `tailwind-merge` (`cn()` helper) | Already the pairing shadcn/ui's own generated components assume; prevents Tailwind class-conflict bugs (e.g., two `bg-*` classes both applying) |

**Key insight:** Every "don't hand-roll" item above is already a locked stack dependency (per CLAUDE.md) — the risk this phase specifically needs to avoid is not "missing a library" but "using the wrong API generation or pattern within an already-correct library" (TanStack's grouping API, dnd-kit's two doc generations, shadcn's evolving form pattern — see State of the Art).

## Common Pitfalls

### Pitfall 1: TypeScript 7.0 breaks `typescript-eslint`, silently or loudly
**What goes wrong:** Scaffolding with `typescript@7.0.2` (CLAUDE.md's headline recommendation) and then adding `typescript-eslint` (also in CLAUDE.md's dev tools) either fails the install (peer dependency conflict) or, if forced with `--legacy-peer-deps`/`--force`, produces confusing type-check failures in the editor/CI that have nothing to do with the actual code.
**Why it happens:** `typescript-eslint@8.68.0` (verified latest, npm registry) declares `peerDependencies.typescript: ">=4.8.4 <6.1.0"` [VERIFIED: npm registry] — it does not yet support TS 7's rewritten native compiler.
**How to avoid:** Pin `typescript@5.9.3` [VERIFIED: npm registry, latest 5.9.x] for this phase's scaffold. Revisit TS 7 once `typescript-eslint` publishes a compatible release (check `npm view typescript-eslint peerDependencies` before any future upgrade).
**Warning signs:** `npm install` peer-dependency warnings/errors mentioning `typescript-eslint` and `typescript` version ranges; ESLint failing to parse valid TS7 syntax/output.

### Pitfall 2: Two incompatible `@dnd-kit` doc generations are live simultaneously
**What goes wrong:** Searching for "`dnd-kit` multiple containers" today surfaces both `dndkit.com/react/guides/...` (the **next-generation** rewrite, package `@dnd-kit/react`, API built around `DragDropProvider`/`useDroppable`/`useDraggable` with a different internal architecture) and `docs.dndkit.com` (redirects to a page explicitly labeled "**Legacy**", the **classic** API — `DndContext`/`SortableContext`/`useSortable`/`arrayMove` — from the `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` package trio). CLAUDE.md/`research/STACK.md` pin the classic trio (`@dnd-kit/core@6.3.1`). Copying a `DragDropProvider`-based example against these pinned packages will not compile — `@dnd-kit/react` is a separate, independently-versioned package (`0.5.0` on npm [VERIFIED: npm registry]) not installed by this stack.
**Why it happens:** The dnd-kit maintainer shipped a new architecture under a new package name while continuing to publish patch/minor releases of the classic packages, and both documentation sites are actively promoted, with no version banner obvious from a search snippet.
**How to avoid:** Any dnd-kit code example used in a plan or implementation must import from `@dnd-kit/core`, `@dnd-kit/sortable`, or `@dnd-kit/utilities` — not `@dnd-kit/react`. Prefer `docs.dndkit.com` (labeled "Legacy" but matches the pinned version) or the actual GitHub source (`github.com/clauderic/dnd-kit/blob/master/stories/...`) over `dndkit.com/react/...`.
**Warning signs:** Import statements referencing `@dnd-kit/react` or `DragDropProvider` anywhere in a plan/task that also lists `@dnd-kit/core` as a dependency — these are mutually exclusive API generations.

### Pitfall 3: `@dnd-kit/sortable`'s version does not track `@dnd-kit/core`'s
**What goes wrong:** Following CLAUDE.md's literal guidance ("`@dnd-kit/utilities`, `@dnd-kit/modifiers` — matching `@dnd-kit/core` version") and attempting `npm install @dnd-kit/sortable@6.3.1` fails or installs a 2+ year stale package — `@dnd-kit/sortable` has no `6.3.1` release; its own version line is independently at major `10`.
**Why it happens:** Within the classic dnd-kit monorepo, `@dnd-kit/core` and `@dnd-kit/sortable` are released together but versioned independently (verified via `npm view @dnd-kit/sortable versions` — the line goes 6→7→8→9→10 across the same release dates `@dnd-kit/core` went 6.0→6.1→6.2→6.3). `@dnd-kit/utilities` genuinely does track a lower, slower-moving number (3.2.2) — so the "matching version" guidance is only correct for `utilities`, not `sortable`.
**How to avoid:** Just run `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` without pinning exact matching numbers and let npm resolve each package's own latest; verify with `npm view <pkg> version` at install time rather than assuming a shared version number.
**Warning signs:** `npm install` reporting no matching version found for `@dnd-kit/sortable@6.x`.

### Pitfall 4: Local machine's Node.js version is below Vite 8's minimum
**What goes wrong:** `npm create vite@latest` either fails outright or silently installs/runs in a degraded/unsupported mode.
**Why it happens:** This session's `node --version` on the target machine returned `v20.12.1`; Vite 8 requires `20.19+` or `22.12+` [CITED: vite.dev/guide]. `20.12.1 < 20.19.0`.
**How to avoid:** Upgrade Node (via nvm-windows, volta, or a direct installer) to at least `20.19.x` (matching the existing major, lowest-friction) before running the scaffold step. This must be the very first task in Phase 1's plan — everything else depends on it.
**Warning signs:** `npm create vite@latest` erroring with an `EBADENGINE` warning or Vite dev server failing to start with an unclear native-binding error (Vite 8 ships native Rolldown/Lightning CSS binaries per the Rolldown migration).

## Code Examples

### Vite 8 + Tailwind v4 + shadcn/ui scaffold sequence
```bash
# Source: https://ui.shadcn.com/docs/installation/vite (CITED, official shadcn/ui docs)
npm create vite@latest .          # select React + TypeScript template
npm install tailwindcss @tailwindcss/vite
```
```css
/* src/index.css — Source: ui.shadcn.com/docs/installation/vite + tailwindcss.com/docs/upgrade-guide (CITED) */
@import "tailwindcss";
```
```json
// tsconfig.json AND tsconfig.app.json — Source: ui.shadcn.com/docs/installation/vite (CITED)
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```
```typescript
// vite.config.ts — Source: ui.shadcn.com/docs/installation/vite (CITED)
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```
```bash
npm install -D @types/node
npx shadcn@latest init
npx shadcn@latest add button dialog select input label form
```

### Tailwind v4 `@theme` CSS-first config (replaces `tailwind.config.js`)
```css
/* Source: tailwindcss.com/docs/upgrade-guide (CITED, official) */
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.6 0.15 250);
  --font-display: "Inter", sans-serif;
}
```

### Zustand 5 store with a repository-calling async action
```typescript
// Source: github.com/pmndrs/zustand docs/learn/guides/beginner-typescript.md (CITED, official)
// pattern adapted to this project's DealsRepository seam (per research/ARCHITECTURE.md Pattern 2)
import { create } from "zustand";
import { dealsRepository } from "@/data";
import type { Deal, NewDealInput, PipelineGroup } from "@/shared/types/deal";
import { fromPipelineGroup } from "@/shared/utils/pipeline-group";

interface PipelineState {
  deals: Deal[];
  status: "idle" | "loading" | "ready";
  load: () => Promise<void>;
  addDeal: (input: NewDealInput) => Promise<void>;
  moveStage: (dealId: string, group: PipelineGroup) => Promise<void>;
}

export const usePipelineStore = create<PipelineState>()((set, get) => ({
  deals: [],
  status: "idle",
  load: async () => {
    set({ status: "loading" });
    const deals = await dealsRepository.list();
    set({ deals, status: "ready" });
  },
  addDeal: async (input) => {
    const created = await dealsRepository.create(input);
    set({ deals: [...get().deals, created] });
  },
  moveStage: async (dealId, group) => {
    const current = get().deals.find((d) => d.id === dealId);
    const patch = fromPipelineGroup(group, current?.pipelineStage);
    const updated = await dealsRepository.update(dealId, patch);
    set({ deals: get().deals.map((d) => (d.id === dealId ? updated : d)) });
  },
}));
```

### react-hook-form + zod add-deal form inside a shadcn Dialog
```typescript
// Source: ui.shadcn.com/docs/forms/react-hook-form (CITED, official — current shadcn/ui
// pattern uses Controller + Field/FieldLabel/FieldError, not the older FormField/FormItem
// pattern many 2024-era tutorials still show; verify against what `npx shadcn@latest add form`
// actually scaffolds at execution time, since shadcn ships copied source, not a fixed API)
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const addDealSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  value: z.coerce.number().positive("Value must be positive"),
  owner: z.string().min(1, "Owner is required"),
  closeDate: z.string().min(1, "Close date is required"),
  group: z.enum(["prospect", "lead", "opportunity", "deal", "lost"]),
});
type AddDealFormValues = z.infer<typeof addDealSchema>;

function AddDealDialog({ onSubmit }: { onSubmit: (v: AddDealFormValues) => void }) {
  const form = useForm<AddDealFormValues>({
    resolver: zodResolver(addDealSchema),
    defaultValues: { group: "prospect" },
  });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
            <Input {...field} id={field.name} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      {/* company, value, owner, closeDate, group (Select) fields follow the same pattern */}
    </form>
  );
}
```

### @faker-js/faker v10 seed data generation
```typescript
// Source: faker-js/faker usage cross-checked across multiple 2026 examples (CITED, MEDIUM confidence — no single official "generate array" doc page found, pattern is faker's own documented API surface: faker.helpers.multiple)
import { faker } from "@faker-js/faker";
import type { Deal } from "@/shared/types/deal";

const STAGES: Deal["pipelineStage"][] = ["prospect", "lead", "opportunity", "deal"];

export const seedDeals: Deal[] = faker.helpers.multiple(
  () => {
    const pipelineStage = faker.helpers.arrayElement(STAGES);
    const isLost = faker.datatype.boolean({ probability: 0.15 });
    return {
      id: faker.string.uuid(),
      name: faker.company.buzzPhrase(),
      company: faker.company.name(),
      value: faker.number.int({ min: 5_000, max: 250_000 }),
      owner: faker.person.fullName(),
      closeDate: faker.date.soon({ days: 90 }).toISOString(),
      pipelineStage,
      outcome: isLost ? "lost" : "open",
      createdAt: faker.date.recent({ days: 60 }).toISOString(),
    } satisfies Deal;
  },
  { count: 40 } // distribute ~8 per group across 5 UI groups — non-trivial demo dataset
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| shadcn/ui `FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` composition (what most 2024-2025 RHF+zod+shadcn tutorials show) | `Controller` + `Field`/`FieldLabel`/`FieldDescription`/`FieldError` composition [CITED: ui.shadcn.com/docs/forms/react-hook-form] | Sometime before this research date (2026-08-28); exact date not surfaced | Any add-deal form code copied from an older tutorial/blog post will use component names (`FormField`, `FormMessage`) that may not match what `npx shadcn@latest add form` scaffolds today — verify against the actually-generated component file, don't hardcode from memory |
| Tailwind `tailwind.config.js` + `@tailwind base/components/utilities` directives | `@theme` block inside CSS + single `@import "tailwindcss"` [CITED: tailwindcss.com/docs/upgrade-guide] | Tailwind v4 (already reflected correctly in CLAUDE.md) | Confirmed correct in this session; no `tailwind.config.js` file needed for this phase |
| Rollup/esbuild dual-bundler Vite | Rolldown-only Vite 8 | Vite 8 (March 2026 per prior research) | `build.rollupOptions` renamed to `build.rolldownOptions`; some Rollup plugin hooks removed (`shouldTransformCachedModule`, `resolveImportMeta`, others) — low risk for this phase's minimal `vite.config.ts`, but relevant if a plugin beyond `@vitejs/plugin-react`/`@tailwindcss/vite` is later added [CITED: vite.dev/blog/announcing-vite8-beta + cross-checked web sources] |
| `@dnd-kit/core` + `@dnd-kit/sortable` (classic) | `@dnd-kit/react` (next-gen, `DragDropProvider`) also exists now | Package published as `0.5.0`, independent of the classic line | This project's locked stack uses the classic line — see Common Pitfalls #2. Do not treat next-gen docs/examples as applicable |

**Deprecated/outdated:**
- Tailwind v3-era utility names (`shadow-sm`→now `shadow-xs`, `rounded-sm`→`rounded-xs`, `outline-none`→`outline-hidden`, unprefixed `ring` now 1px not 3px) — not directly relevant to Phase 1's minimal custom CSS, but relevant the moment shadcn-generated component classes or hand-written Tailwind utilities are copied from a v3-era reference/tutorial [CITED: tailwindcss.com/docs/upgrade-guide].

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | "Deal/Won" UI group for Phase 1 maps to `pipelineStage === "deal"` with `outcome` left `"open"` (no explicit won-transition yet) | Architecture Patterns, Pattern 2 | If the planner/user intends "Deal" and "Won" to be visually and semantically distinct even in Phase 1 (i.e., 5 truly independent stored states, not a derived 4+1 split), the `PipelineGroup` derivation and `fromPipelineGroup` mapping need to change; low risk to fix since it's isolated to one selector function, but affects the `Deal` type shape check by the planner |
| A2 | When a new deal is created directly into the "Lost" group (D-02's stage selector allows this), `pipelineStage` defaults to `"prospect"` since there is no prior stage to preserve | Architecture Patterns, Pattern 2 (`fromPipelineGroup`) | Cosmetic risk only — affects what stage a directly-added lost deal "shows" it was lost from; no functional/requirement impact since Phase 1 has no lost-reason reporting yet (that's Phase 3/4) |
| A3 | Phase 1 does not need a client-side router (`react-router` or similar); defer until Phase 4 adds the `/forecast` route | Standard Stack, Alternatives Considered | If the planner wants route-based structure established now for easier Phase 4 wiring, this is a cheap addition (`react-router` install + two-line route config) — flagged as Open Question below rather than a hard blocker |
| A4 | `@faker-js/faker`'s `faker.helpers.multiple` is the correct v10 API for generating the seed array (no official single-page "generate array" doc was found to confirm this exact method name against v10 specifically) | Code Examples, seed data | Low risk — `faker.helpers.multiple` and the `Array.from({length}, () => ...)` alternative are both broadly cross-checked patterns; if `multiple` was renamed/removed in v10, `Array.from` is a safe drop-in fallback with identical output shape |

## Open Questions (RESOLVED)

1. **(RESOLVED) Does Phase 1 need `react-router` installed now, or is a single-view app sufficient until Phase 4?**
   - What we know: CLAUDE.md/`research/STACK.md` list no router at all; Phase 1 has exactly one page (the pipeline board); Phase 4 adds a second (`/forecast`).
   - What's unclear: Whether the planner wants routing infrastructure established now (cheap, ~2 lines) purely for structural consistency with `research/ARCHITECTURE.md`'s `app/routes.tsx` sketch, vs. deferring it as genuinely unneeded until Phase 4.
   - Recommendation: Defer. Mount `<PipelineBoard />` directly from `App.tsx` for Phase 1; introduce a router in Phase 4 alongside the second route. This keeps the walking skeleton as thin as possible.
   - Resolution: Adopted as planned — SKELETON.md and 01-01/01-02 defer routing to Phase 4; no router installed this phase.

2. **(RESOLVED) Does the Phase 1 "Deal/Won" group need `outcome: "won"` set explicitly, or is `pipelineStage: "deal"` sufficient for this phase's success criteria?**
   - What we know: Success criteria only require deals to visually appear in a "Deal/Won" section and be movable there; no requirement this phase reads or displays `outcome` directly.
   - What's unclear: Whether Phase 2/3 planning will expect `outcome` to already be meaningfully set by Phase 1, or whether Phase 3 owns introducing the actual won/lost transition semantics from scratch.
   - Recommendation: Leave `outcome: "open"` for all non-lost Phase 1 deals (including those in the "Deal" group) — Pattern 2 above already reflects this — and let Phase 3 (per its own research) define the actual won-transition action.
   - Resolution: Adopted as planned — 01-02 Task 1 sets `outcome: "open"` for all non-lost seed deals; Phase 3 owns the won-transition action.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | `npm create vite@latest` (Vite 8 requires 20.19+ or 22.12+) | ✗ (below minimum) | v20.12.1 installed [VERIFIED: `node --version` this session] | None — must upgrade Node before any scaffold step; no viable downgrade path for Vite 8 |
| npm | package installs | ✓ | 10.5.0 | — |
| git | commits/version control (already an initialized repo) | ✓ | 2.44.0.windows.1 | — |
| Internet access / npm registry | all `npm install` steps, `npx shadcn@latest` | ✓ (confirmed — registry queries succeeded throughout this research session) | — | — |

**Missing dependencies with no fallback:**
- Node.js version — current `v20.12.1` is below Vite 8's `20.19+`/`22.12+` requirement. This is a blocking, must-fix-first item for Phase 1's plan (an early task: "upgrade Node to 20.19+ or 22.12+ before scaffolding").

**Missing dependencies with fallback:**
- None — the Node version gap has no fallback within the locked stack (Vite 8 is a locked decision per CLAUDE.md); the only path forward is upgrading Node.

## Security Domain

`security_enforcement` is on (ASVS level 1, block on `high`) per `.planning/config.json`. This phase is explicitly frontend-only, no-auth, mock-data-only per PROJECT.md — most ASVS categories genuinely don't apply yet. The one category with real teeth this phase:

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | No | Explicitly out of scope this milestone (PROJECT.md) |
| V3 Session Management | No | No sessions exist — no backend, no auth |
| V4 Access Control | No | Single-user prototype, no access boundaries to enforce |
| V5 Input Validation | Yes | zod schema on the add-deal form (`addDealSchema`) — already the plan; validate `value` is a positive number, all required text fields are non-empty, `closeDate` is a valid date string |
| V6 Cryptography | No | No secrets, tokens, or encrypted data handled this phase |

### Known Threat Patterns for this stack (Phase 1 scope)

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Unvalidated form input reaching the in-memory store (e.g., negative deal value, empty required field bypassing client JS) | Tampering | zod schema validation via `zodResolver`, enforced before `addDeal()` is ever called — already the recommended pattern in Code Examples |
| Seed/mock data containing realistic-looking real company/person names that get committed to the repo | Information Disclosure (perception risk, not real disclosure) | `research/PITFALLS.md`'s existing guidance: use `@faker-js/faker`'s fictional generators (`faker.company.name()`, `faker.person.fullName()`), never real prospect data, even for internal demos — already reflected in the seed data Code Example above |

No injection/XSS-class concerns are introduced this phase (no `dangerouslySetInnerHTML`, no raw HTML rendering of user input, no network calls to sanitize responses from).

## Sources

### Primary (HIGH confidence)
- npm registry, direct `npm view` calls this session (2026-08-28) — all package versions in Standard Stack and Package Legitimacy Audit
- `gsd-tools query package-legitimacy check` — verdicts, download counts, repo URLs, postinstall-script check for all installed packages

### Secondary (MEDIUM confidence — official docs, fetched and read this session)
- https://vite.dev/guide/ — Node.js version requirement (20.19+/22.12+)
- https://vite.dev/blog/announcing-vite8-beta — Rolldown migration notes
- https://ui.shadcn.com/docs/installation/vite — Vite + Tailwind v4 + shadcn/ui scaffold sequence
- https://ui.shadcn.com/docs/forms/react-hook-form — current (Controller/Field-based) RHF+zod+shadcn pattern
- https://tailwindcss.com/docs/upgrade-guide — Tailwind v4 breaking changes, `@theme` CSS-first config
- https://tanstack.com/table/latest/docs/framework/react/guide/grouping — `getGroupedRowModel` is column-value-driven, not fixed-section-driven
- https://docs.dndkit.com/presets/sortable (redirects to dndkit.com/presets/sortable, labeled "Legacy") — confirms classic API generation matches pinned `@dnd-kit/core`
- https://github.com/clauderic/dnd-kit/blob/master/stories/2%20-%20Presets/Sortable/MultipleContainers.tsx — actual official multi-container drag example, classic API
- https://github.com/pmndrs/zustand/blob/HEAD/docs/learn/guides/beginner-typescript.md — curried `create<State>()()` TypeScript pattern, async action example

### Tertiary (LOW confidence — cross-checked web search summaries, not independently fetched from primary source)
- @faker-js/faker `faker.helpers.multiple` array-generation pattern — cross-checked across multiple 2026 blog/tutorial sources, no single official "generate array" doc page was fetched directly

## Metadata

**Confidence breakdown:**
- Standard stack (versions): HIGH — every version verified directly against npm registry this session
- Architecture (Phase 1-specific patterns): MEDIUM-HIGH — TanStack grouping-fit and dnd-kit version-pairing findings verified against official/source docs; the `pipelineStage`/`outcome` split is inherited as settled from CONTEXT.md's citation of `research/PITFALLS.md`, not re-derived
- Pitfalls (this phase's environment/version gotchas): HIGH — Node version, typescript-eslint peer range, and dnd-kit version-pairing are all directly tool-verified, not inferred
- Seed data generation pattern: MEDIUM — cross-checked web sources, not fetched from a single official reference page

**Research date:** 2026-08-28
**Valid until:** 7 days for the exact npm version pins (fast-moving 2026 majors: Vite 8, TS 7, React 19.2, Tailwind 4 all shipped/updated within the last ~5 months) — re-verify versions with `npm view` immediately before actually running the install commands if planning is delayed past this window. Architecture/pattern guidance (TanStack grouping fit, dnd-kit version split, RHF+zod+shadcn wiring) is more stable — 30 days.
