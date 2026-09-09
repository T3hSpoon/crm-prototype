# Phase 2: Deal Detail & Line Items - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 2-Deal Detail & Line Items
**Areas discussed:** Detail view layout & trigger

---

## Detail View Layout & Trigger

**Question 1: How should the deal detail view be presented?**

| Option | Description | Selected |
|--------|-------------|----------|
| Side drawer/panel | Slides in from the side, board stays visible behind it; research explicitly recommends this over a page for a prototype | ✓ |
| Modal dialog | Same shadcn Dialog as Add Deal, no new primitive, but fully blocks the board | |
| Full page / separate route | Needs a router (none installed); loses pipeline context; the option research advises against | |

**User's choice:** Side drawer/panel

**Question 2: What opens the deal detail view from the pipeline table?**

| Option | Description | Selected |
|--------|-------------|----------|
| Click anywhere on the row | Lowest-friction, monday.com-familiar; needs care around the Stage Select click target | ✓ |
| Dedicated icon/button per row | More discoverable as a distinct action, avoids click-target ambiguity | |

**User's choice:** Click anywhere on the row

**Question 3: Does the detail view stay open after an edit, or close automatically?**

| Option | Description | Selected |
|--------|-------------|----------|
| Stays open until explicitly closed | Supports multiple edits (fields + line items) in one visit | ✓ |
| Closes after each field edit | Mirrors Add Deal's close-on-submit; likely tedious with several editable fields | |

**User's choice:** Stays open until explicitly closed

**Notes:** All three answers matched the recommended option. User declined further questions on this area and chose not to discuss the remaining three gray areas (Inline core-field editing, Line-item add/edit/remove UX, Value override behavior), deferring them to Claude's discretion.

---

## Claude's Discretion

- **Inline core-field editing UX** — click-to-edit-in-place in the pipeline table (click cell, becomes input, save on blur/Enter, Escape cancels). Not discussed with the user; informed by `research/FEATURES.md`'s "handful of fields that matter" guidance and REQUIREMENTS.md's explicit exclusion of full spreadsheet-grade editing.
- **Line-item add/edit/remove UX** — inline-editable mini-table inside the drawer, "Add Line Item" button appends a row, per-row remove control, `crypto.randomUUID()` ids. Not discussed with the user; the underlying data shape (`Deal.lineItems: LineItem[]`, one level, id-based) was already locked by `research/PITFALLS.md` Pitfall 2, so only the UI mechanism was left open.
- **Value override behavior** — "computed-until-touched" pattern: Value field always editable, auto-tracks the line-item sum until the user diverges from it, then a "Reset to sum" affordance appears rather than silently overwriting a manual entry. **Flagged explicitly by `research/FEATURES.md` as needing an explicit user decision** — the user chose not to discuss it this round, so this is a genuine unvalidated judgment call, not a settled preference. Researcher/planner should feel free to raise it again with the user if the approach doesn't fit.

## Deferred Ideas

None — discussion stayed within phase scope. No scope-creep suggestions came up.
