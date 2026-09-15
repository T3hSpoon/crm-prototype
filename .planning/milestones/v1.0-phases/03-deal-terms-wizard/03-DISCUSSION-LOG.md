# Phase 3: Lost & Won Tracking - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-09
**Phase:** 3-Lost & Won Tracking (scope redirected this session)
**Areas discussed:** Initial gray-area menu (declined), Deal-terms modal scope, Phase scope change, Deal-terms field details, Wrap-up

---

## Initial gray-area menu (presented, not discussed)

| Option | Description | Selected |
|--------|-------------|----------|
| Won-transition mechanism | New "Won" StageSelect destination vs. separate "Mark as Won" action | |
| Lost-reason capture UX | Confirm dialog gating the move-to-Lost action | |
| Reason field structure | Preset dropdown vs. free text vs. both | |
| Reversibility of Lost/Won | Can a deal move back out of Lost/Won into an active stage | |

**User's choice:** None of the above — the user redirected via free text to a different topic entirely (the deal-terms/contract-fields Add Deal modal). None of these four areas were discussed or decided this session.
**Notes:** These four areas remain open for whichever future phase picks up LOST-01/LOST-02/PIPE-03.

---

## Deal-terms modal: where fields apply

| Option | Description | Selected |
|--------|-------------|----------|
| Every deal, at creation | 2-step Add Deal wizard for ALL new deals; step 2 captures deal-terms fields | ✓ |
| Only when marking Won | Add Deal stays single-step; deal-terms captured at a separate Won-transition step | |

**User's choice:** Every deal, at creation.
**Notes:** User confirmed this a second time in a later answer ("I want it for every deal, at creation").

---

## Phase scope: build lost/won flow too, or deal-terms only?

| Option | Description | Selected |
|--------|-------------|----------|
| Both in this phase | Deal-terms modal AND lost-reason gate + Won group, same phase | |
| Deal terms only, now | This phase becomes just the deal-terms modal; lost/won moves to a later phase | ✓ |

**User's choice:** Deal terms only, now.
**Notes:** First asked alongside the "every deal, at creation" question; user's answer to that combined turn was ambiguous (re-affirmed "every deal, at creation" and introduced contract/quote template ideas instead of directly answering scope). Re-asked as a standalone question afterward and got an explicit answer: "Deal terms only, now." This is why ROADMAP.md/REQUIREMENTS.md need a follow-up update — see CONTEXT.md D-00.

---

## Deal-terms field details

### Currency options
| Option | Description | Selected |
|--------|-------------|----------|
| USD only | Single-value selector | |
| Small fixed list | USD, EUR, GBP, CAD | |
| Full ISO 4217 list | Every standard currency code | |

**User's choice (free text):** USD, EUR and GBP.

### Frequency options
| Option | Description | Selected |
|--------|-------------|----------|
| Monthly / Quarterly / Annually | 3 options | |
| Monthly / Quarterly / Semi-Annual / Annually | 4 options | |

**User's choice (free text):** Monthly, quarterly, quadrimestral, semi-annual, annually (5 options).

### Field requiredness
| Option | Description | Selected |
|--------|-------------|----------|
| All required | Matches Phase 1's full-intake precedent | ✓ |
| Optional, with defaults | Can skip fields; sensible defaults apply | |

**User's choice:** All required.

### Wizard navigation
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, Back button | Step 2 has Back (preserves step 1 values) + Submit | ✓ |
| No, forward only | Only Cancel or Submit from step 2 | |

**User's choice:** Yes, Back button.

---

## Wrap-up

| Option | Description | Selected |
|--------|-------------|----------|
| Ready for context | Write CONTEXT.md with what's captured | ✓ |
| More to discuss | Continue clarifying | |

**User's choice:** Ready for context.

---

## Claude's Discretion

- Exact type shape for the new fields (flat on `Deal`/`NewDealInput` vs. nested `contractTerms` object) — default to the existing flat-field convention.
- Regenerating the 40 seed deals with the new required fields via faker.
- Step-indicator UI treatment for the 2-step wizard.
- Whether Grace Period / Contract Term allow 0 — defaulted to yes, with a non-negative floor.

## Deferred Ideas

- Contract template generation (auto-filled from deal-terms + deal data) — future phase, explicitly requested to be "kept in mind."
- Quote template generation (auto-filled from deal data) — future phase, same treatment.
- LOST-01 / LOST-02 (lost-reason-required gate) — originally this phase's scope; deferred to a later phase.
- PIPE-03 (Won/contracts-list group) — originally this phase's scope; deferred to a later phase.
- WON-01 (Won-triggered contract-terms form) — deferred to a later phase.

---

## Follow-up session (2026-09-09, later same day): roadmap conflict check

Between this discussion and the current session, `WON-01` (a Won-triggered contract-terms-form requirement) was added to ROADMAP.md/REQUIREMENTS.md as Phase 3 scope — independently of, and in conflict with, the redirect captured above. A second `/gsd-discuss-phase 3` invocation surfaced this conflict before any planning happened.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep roadmap's version | Discard this CONTEXT.md's redirect; Phase 3 = lost-reason gate + Won-triggered contract-terms form (LOST-01, LOST-02, PIPE-03, WON-01) | |
| Keep CONTEXT.md's redirect | Phase 3 stays the deal-terms Add-Deal wizard; defer WON-01 alongside LOST-01/LOST-02/PIPE-03; update roadmap via `/gsd-phase` before planning | ✓ |
| View CONTEXT.md and decide | Re-read full CONTEXT.md/log before choosing | |

**User's choice:** Keep CONTEXT.md's redirect.
**Notes:** CONTEXT.md D-00 and the Deferred Ideas section were both updated to explicitly add WON-01 to the deferred set. `/gsd-phase` still needs to run before `/gsd-plan-phase 3` to reconcile ROADMAP.md/REQUIREMENTS.md/PROJECT.md — this has not happened yet.
