# Phase 1: Pipeline Board Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-28
**Phase:** 1-Pipeline Board Foundation
**Areas discussed:** Add-deal form scope

---

## Add-Deal Form Scope

**Q1: Which fields must be filled in to create a new deal?**

| Option | Description | Selected |
|--------|-------------|----------|
| Name + Company only | Fastest possible add — value, owner, close date left blank/default and filled in later via Phase 2's inline editing. | |
| Name + Company + Value | Also captures the dollar value up front, so pipeline totals and group subtotals are meaningful immediately after adding. | |
| Full intake: + Owner + Close Date | Fuller record from day one — more fields to fill before the deal can be created, but nothing left incomplete. | ✓ |

**User's choice:** Full intake: + Owner + Close Date

---

**Q2: What stage does a newly added deal start in?**

| Option | Description | Selected |
|--------|-------------|----------|
| Always Prospect | Every new entry funnels in at the top, matching the standard "new lead" mental model. Simplest to build. | |
| User picks the stage | The form includes a stage selector — useful for entering a deal you're already mid-negotiation on, not just brand-new leads. | ✓ |

**User's choice:** User picks the stage

---

**Q3: Where does the add-deal form live?**

| Option | Description | Selected |
|--------|-------------|----------|
| Modal/dialog | Triggered by an "Add Deal" button; focused overlay, doesn't disturb the table underneath. | ✓ |
| Inline row at top of a group | Add directly in context within the stage group you're adding to — no overlay, but means picking a group first. | |
| Slide-over panel | Consistent with the deal-detail drawer Phase 2 will add later, so add and edit share the same UI pattern from the start. | |

**User's choice:** Modal/dialog

---

**Q4: What happens right after the user submits the add-deal form?**

| Option | Description | Selected |
|--------|-------------|----------|
| Deal appears, form closes | Standard one-and-done flow — new deal shows up in its group, modal dismisses. | ✓ |
| Deal appears, form stays open | Batch-add mode — fields reset but the modal stays open so the user can quickly add several deals in a row (e.g. seeding a demo). | |

**User's choice:** Deal appears, form closes

---

## Claude's Discretion

The following gray areas were presented but not selected for discussion — left to research/planning discretion, informed by existing research docs:
- Stage-move interaction (drag-and-drop vs. dropdown/menu)
- Seed data profile (mock deal count, realism, distribution)
- Pipeline row content (which fields show per row in Phase 1)

## Deferred Ideas

None — discussion stayed within phase scope.
