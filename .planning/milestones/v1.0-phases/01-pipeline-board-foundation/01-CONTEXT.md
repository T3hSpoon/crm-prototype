# Phase 1: Pipeline Board Foundation - Context

**Gathered:** 2026-08-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view the sales pipeline as a grouped table and manage deals moving through it. Concretely: a table grouped into five pipeline-stage sections (Prospect, Lead, Opportunity, Deal/Won, Lost) populated from mock seed data; a form to add a new prospect/deal that appears immediately in the correct group; and a way to move a deal from one stage to another. No inline field editing, no line items, no lost-reason gating, no forecast page — those are Phases 2-4. Covers requirements PIPE-01, PIPE-02, DEAL-01.

</domain>

<decisions>
## Implementation Decisions

### Add-Deal Form Scope
- **D-01:** Add-deal form is a full intake: Name, Company, Value, Owner, and Close Date are all required to create a deal — no partial/minimal-add path. — **Reversibility:** reversible — purely a form-validation rule change, no data model impact.
- **D-02:** The form includes a stage selector — the user picks which of the five groups the new deal starts in, rather than always defaulting to Prospect. Supports entering a deal that's already mid-negotiation, not just brand-new leads.
- **D-03:** The form is a modal/dialog triggered by an "Add Deal" button (not an inline row-in-group or a slide-over panel).
- **D-04:** On submit, the deal appears in its selected group immediately and the modal closes (no batch-add/keep-open mode).

### Claude's Discretion
The user chose to discuss only "Add-deal form scope" this round. The following gray areas were presented but not discussed — Claude/researcher/planner have discretion, informed by the research already on file (see Canonical References):
- **Stage-move interaction** (drag-and-drop vs. dropdown/menu action per row) — `research/FEATURES.md` notes a status-dropdown is functionally equivalent to drag-drop for a grouped table and needs no dnd library for v1, while the project's tech stack already includes `@dnd-kit` for this interaction. Either is acceptable for Phase 1; pick based on effort vs. polish trade-off, and it's fine to ship the simpler mechanism first and layer drag-and-drop on later without changing the underlying `moveStage` data operation.
- **Seed data profile** (mock deal count, realism, distribution across the five groups) — no constraint given; use enough varied deals per group to make each group non-empty and the demo convincing (`@faker-js/faker` is already in the stack for this).
- **Pipeline row content** (which fields show on a deal row before Phase 2 adds the detail drawer/line items) — no constraint given; `research/FEATURES.md` suggests name/company, value, owner, close date, and stage as the baseline row fields, with group-level count/value totals in each section header.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope & requirements
- `.planning/PROJECT.md` — core value, active requirements, out-of-scope list, and locked key decisions (pipeline order, mock-data-only, React stack, own visual design, line items, lost/won modeling, no auth)
- `.planning/REQUIREMENTS.md` — full requirement IDs (PIPE-01, PIPE-02, DEAL-01 for this phase) and traceability to phases
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and dependencies

### Architecture & data model
- `.planning/research/ARCHITECTURE.md` — repository-pattern data seam (`DealsRepository` interface + `MockDealsRepository`), recommended `src/` folder structure (`features/pipeline/`, `data/`, `shared/types/`), Zustand store pattern (store actions call the repository, components call the store), forecast-as-derived-selector pattern. This phase must stand up the data seam and store shape that Phases 2-4 build on.
- `.planning/research/PITFALLS.md` — critical for this phase: Pitfall 1 (mock data must be shaped like a future API resource, stable `id` fields not array index, stage as enum not label), Pitfall 3 (model `pipelineStage` and `outcome` as separate concerns even though Phase 1 doesn't yet enforce the lost-reason gate, so Phase 3 doesn't require a data-model rework), Pitfall 5 (id-based updates, not index-based, to survive future grouping/filtering), Pitfall 6 (scope CSS locally, don't assume standalone app ownership — this prototype merges into the existing iDrive project later)
- `.planning/research/FEATURES.md` — MVP feature list and complexity notes; specifically informs the "Claude's Discretion" items above (stage-move interaction, row content, table-stakes vs. differentiator framing)

### Tech stack
- `.claude/CLAUDE.md` (Technology Stack section) — locked stack: React 19.2, TypeScript, Vite 8, `@tanstack/react-table`, `@dnd-kit`, Zustand, Tailwind + shadcn/ui, react-hook-form + zod, `@faker-js/faker` for seed data

</canonical_refs>

<code_context>
## Existing Code Insights

No application code exists yet — this is a greenfield phase. `package.json` has not been created; only `.claude/` and `.planning/` exist in the repo.

### Reusable Assets
- None yet — this phase creates the initial scaffold.

### Established Patterns
- None yet in code. Follow the structure and patterns documented in `research/ARCHITECTURE.md` (repository seam, feature folders, Zustand store) since there is no existing code to contradict it.

### Integration Points
- N/A for this phase — no existing system to integrate with. Future integration point (out of scope here) is swapping `MockDealsRepository` for a real API implementation per `research/ARCHITECTURE.md`.

</code_context>

<specifics>
## Specific Ideas

No particular visual or interaction references were given beyond what's already in PROJECT.md (monday.com's Deals board for concept inspiration, not a visual target — own design system, not a clone).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. No scope-creep suggestions came up.

</deferred>

---

*Phase: 1-Pipeline Board Foundation*
*Context gathered: 2026-08-28*
