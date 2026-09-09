# Phase 3: Deal Terms Wizard - Context

**Gathered:** 2026-09-09
**Status:** Planned — roadmap reconciliation (see "Phase Scope Change" below) completed 2026-09-09; ROADMAP.md/REQUIREMENTS.md now match this phase's redirected scope

<domain>
## Phase Boundary

**This phase's actual scope, as redirected by the user during this discussion, is NOT what ROADMAP.md currently says for Phase 3.**

What this phase now delivers: the "Add Deal" flow becomes a 2-step modal wizard. Step 1 keeps today's existing fields (name, company, value, owner, close date, stage/group). Step 2, reached via a "Next" button, captures 5 new "deal terms" fields — Prorata, Grace Period, Contract Term, Frequency, Currency — for every new deal, at creation, regardless of pipeline stage. A Back button returns from step 2 to step 1 without losing entered values.

What this phase does NOT deliver (despite being ROADMAP.md's original Phase 3 definition): the lost-reason-required gate (LOST-01, LOST-02), the Won/contracts-list group (PIPE-03), and the Won-triggered contract-terms form (WON-01 — added to ROADMAP.md/REQUIREMENTS.md in the same working-tree batch as this redirect, so it must be deferred alongside the other three). Also explicitly out: contract template and quote template generation — the user wants these built later, using the deal-terms data captured here, but not this phase.

</domain>

<decisions>
## Implementation Decisions

### Phase Scope Change — action required before planning
- **D-00 [informational]:** RESOLVED 2026-09-09 — ROADMAP.md and REQUIREMENTS.md have since been reconciled to match this redirect (Phase 3 = Deal Terms Wizard / DEAL-06; Phase 3.1 inserted carrying LOST-01, LOST-02, PIPE-03, WON-01). Kept below as historical record, no longer an action item. This session redirected Phase 3 away from ROADMAP.md's original definition ("Lost & Won Tracking" — LOST-01, LOST-02, PIPE-03) to the deal-terms/contract-fields Add Deal modal instead. This was confirmed twice with the user (see DISCUSSION-LOG.md), then reconfirmed in a follow-up `/gsd-discuss-phase 3` session on 2026-09-09 after that session surfaced a conflict: ROADMAP.md/REQUIREMENTS.md (uncommitted working-tree state) had, in the meantime, also picked up `WON-01` (a Won-triggered contract-terms-form requirement) as Phase 3 scope. The user chose to keep this CONTEXT.md's redirect over the roadmap's version — so `WON-01` must be deferred alongside `LOST-01`/`LOST-02`/`PIPE-03` (see Deferred Ideas). — **Reversibility:** one-way — ROADMAP.md and REQUIREMENTS.md still describe the old Phase 3 (now including WON-01); `/gsd-plan-phase 3` will read a mismatched goal/success-criteria unless the roadmap is updated first. **Recommend running `/gsd-phase` before planning** to redefine Phase 3's goal/requirements to match this CONTEXT.md, and to insert a new later phase carrying LOST-01, LOST-02, PIPE-03, WON-01 (the deferred lost/won work) so none of it is lost from the roadmap.

### Add-Deal Wizard Structure
- **D-01:** Add Deal becomes a 2-step modal wizard, not a single-step form. Step 1 = today's fields. Step 2 = the new deal-terms fields, reached via a "Next" button. — **Reversibility:** costly — touches `AddDealDialog.tsx`, `add-deal-schema.ts`, `Deal`/`NewDealInput` types, and all 40 seed deals (which will need the new required fields populated).
- **D-02:** Step 2 has a Back button (returns to step 1, step-1 values preserved) plus a final Create/Submit button. Cancel closes the whole modal from either step. Forward-only was explicitly rejected in favor of this.
- **D-03:** The 5 deal-terms fields apply to every new deal at creation, in any pipeline stage/group — not gated to only Won deals. (User explicitly chose this over the Won-only alternative.)

### Deal Terms Fields
- **D-04:** Prorata — boolean yes/no.
- **D-05:** Grace Period — number, in days.
- **D-06:** Contract Term — number, in months.
- **D-07:** Frequency — selector, 5 options: Monthly, Quarterly, Quadrimestral (every 4 months), Semi-Annual, Annually.
- **D-08:** Currency — selector, 3 options: USD, EUR, GBP.
- **D-09:** All 5 fields are required to complete the wizard — no skip/partial path, matching Phase 1's D-01 "full intake" precedent for Add Deal.

### Claude's Discretion
- Exact type shape for the new fields (flat fields directly on `Deal`/`NewDealInput` vs. a nested `contractTerms` object) — no constraint given; the existing `Deal` type uses flat fields throughout (see code_context), so default to that convention unless a reason emerges to nest.
- Regenerating the 40 seed deals with the new required fields populated (via `@faker-js/faker`, matching existing seed conventions) — necessary once these fields are required on `Deal`, not a fresh decision point.
- Step-indicator UI (e.g., "Step 1 of 2" label/progress dots) — no constraint given; follow the existing shadcn Dialog visual pattern already established in `AddDealDialog.tsx`.
- Whether Grace Period / Contract Term allow 0 — not discussed; default to allowing 0 (a valid "no grace period" / not-yet-set value) with a non-negative validation floor, consistent with the project's existing positive/non-negative validation conventions (e.g., line-item units/unitPrice).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope & requirements — mismatch flagged
- `.planning/PROJECT.md` — core value, active requirements, locked key decisions. Does not yet mention deal-terms/contract fields; this is new scope introduced in this session.
- `.planning/REQUIREMENTS.md` — original Phase 3 traceability (LOST-01, LOST-02, PIPE-03). Needs a new requirement added for deal-terms capture, and the existing three requirements re-mapped to a later phase. See D-00.
- `.planning/ROADMAP.md` — Phase 3's original goal/success-criteria text ("Lost & Won Tracking") does not match what this phase now builds. See D-00 — run `/gsd-phase` before `/gsd-plan-phase 3`.

### Data model & existing Add Deal flow
- `src/shared/types/deal.ts` — `Deal`, `NewDealInput` types this phase extends with the 5 new deal-terms fields.
- `src/features/pipeline/components/add-deal-schema.ts` — existing `addDealSchema` (zod) + the `AddDealFormValues`/`AddDealFormInput` two-generic pattern for `z.coerce.number()`; the new step 2 schema (Grace Period, Contract Term are both numeric) should follow the same pattern.
- `src/features/pipeline/components/AddDealDialog.tsx` — the current single-step modal this phase converts into a 2-step wizard.

### Prior phase context
- `.planning/phases/01-pipeline-board-foundation/01-CONTEXT.md` — D-01 (full intake, all fields required) and D-03 (modal/dialog trigger, not a slide-over) precedent this phase's wizard follows.
- `.planning/phases/02-deal-detail-line-items/02-CONTEXT.md` — established react-hook-form + zod + shadcn form patterns, reused here for the wizard's step 2.

### Tech stack
- `.claude/CLAUDE.md` (Technology Stack section) — react-hook-form + zod + `@hookform/resolvers` for the wizard's two-step form state; no multi-step/wizard library is in the stack — build the 2-step flow with existing form tooling (e.g., step-gated field visibility within one form, or two coordinated `useForm` instances), an implementation detail for planner.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/shared/types/deal.ts` — `Deal`, `NewDealInput`. Extend both with the 5 new fields: `prorata: boolean`, `gracePeriodDays: number`, `contractTermMonths: number`, `frequency: <enum>`, `currency: <enum>`.
- `src/features/pipeline/components/add-deal-schema.ts` + `AddDealDialog.tsx` — established react-hook-form + zod + shadcn Dialog pattern, including the two-generic `useForm` workaround for `z.coerce.number()`. Reuse for the new step-2 schema.
- `src/components/ui/{dialog,select,input,label,field}.tsx` — shadcn primitives already generated. A `select` primitive already exists (used by `StageSelect` and the Add Deal group picker) — reuse for Frequency/Currency selectors and for the Prorata yes/no choice (two-option select), since no radio/switch primitive exists yet.
- `src/data/mock/seed-data.ts` — `buildSeedDeal()`. Needs updating to generate the 5 new required fields (via faker, matching existing seed conventions) so all 40 seed deals stay valid once these fields are required on `Deal`.

### Established Patterns
- Repository seam: `dealsRepository.create(input: NewDealInput)` — extend `NewDealInput`'s shape, do not create a parallel creation path.
- Every entity addressed by stable `id` — unaffected by this change; deal-terms fields are additional properties on the existing `Deal` record.
- Zod schema = validation + type-inference source (per `.claude/CLAUDE.md`'s recommended stack) — the wizard's step 2 needs its own zod schema segment.

### Integration Points
- The wizard replaces `AddDealDialog.tsx`'s single form; the "Add Deal" trigger button and the store's `addDeal()` action stay the same call site, just with a richer `NewDealInput` payload.
- No other feature currently reads `Deal` beyond the pipeline table and the line-items detail sub-row — no other integration point breaks from adding these fields. Surfacing the new fields in the table/detail view was not requested this phase (capture-at-creation only).

</code_context>

<specifics>
## Specific Ideas

- User's field list, verbatim from discussion: "Prorata: yes/no, Grace Period (days), Contract Term(months), Frequency (selector, for month, quarterly etc, up to yearly), and Currency" — refined during discussion to: Frequency = Monthly/Quarterly/Quadrimestral/Semi-Annual/Annually; Currency = USD/EUR/GBP.
- "I want a Next button, that changes the modal to deal terms" — explicit 2-step wizard triggered by a Next button, not tabs, an accordion, or a second separate dialog.
- Contract template and quote template, "filled with the data from the contract and from the deal" — explicitly deferred (not built this phase), but stated as the reason these fields are being captured now: they're meant to feed future document generation.

</specifics>

<deferred>
## Deferred Ideas

- **Contract template generation** — a document template auto-filled from the deal-terms + deal fields. User wants this "kept in mind" for a future phase.
- **Quote template generation** — a document template auto-filled from deal fields. Same future-phase treatment as above.
- **LOST-01 / LOST-02** (lost-reason-required gate) — originally this phase's scope per ROADMAP.md; explicitly deferred to a later phase during this session (see D-00).
- **PIPE-03** (Won/contracts-list group) — originally this phase's scope per ROADMAP.md; explicitly deferred to a later phase during this session (see D-00).
- **WON-01** (Won-triggered contract-terms form: start/end date, signed date, payment terms, final value) — added to ROADMAP.md/REQUIREMENTS.md as Phase 3 scope after the original redirect discussion; reconfirmed deferred to the same later phase as LOST-01/LOST-02/PIPE-03 in the 2026-09-09 follow-up session (see D-00).

</deferred>

---

*Phase: 3-Deal Terms Wizard (retitled/redirected this session, reconciled into ROADMAP.md/REQUIREMENTS.md same day — see Phase Boundary and D-00)*
*Context gathered: 2026-09-09*
