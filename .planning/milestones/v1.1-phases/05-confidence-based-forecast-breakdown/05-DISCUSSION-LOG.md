# Phase 5: Confidence-Based Forecast Breakdown - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-15
**Phase:** 5-Confidence-Based Forecast Breakdown
**Areas discussed:** Confidence edit UI, Model column with multiple SKUs, ARPU zero-quantity display, Breakdown table layout

---

## Confidence edit UI

| Option | Description | Selected |
|--------|-------------|----------|
| Click-to-reveal dropdown | Matches ROADMAP wording — same click-to-edit shell as owner/value/closeDate (EditableCell): click the cell, it swaps to a select with the 4 options, commits on change/blur, Escape cancels | ✓ |
| Always-visible dropdown | Like StageSelect — no separate click-to-enter-edit-mode step | |

**User's choice:** Click-to-reveal dropdown (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| shadcn Select | Matches StageSelect's existing enum-picker pattern and the project's shadcn/ui convention | ✓ |
| Native `<select>` | Matches EditableCell's plain `<input>` element more literally, but the only native form control in the table | |

**User's choice:** shadcn Select (recommended)
**Notes:** Both recommended options accepted without discussion — result is D-01/D-02/D-03 in CONTEXT.md.

---

## Model column with multiple SKUs

| Option | Description | Selected |
|--------|-------------|----------|
| Comma-join all SKUs | Mirrors the Services column's own comma-join convention | ✓ |
| Comma-join service-type SKUs only | Scoped to service line items like Quantity/ARPU/MRR/ARR | |
| First line item's SKU only | Simpler single-value display; loses information | |

**User's choice:** Comma-join all SKUs (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Blank/em-dash — | Matches EditableCell's existing — placeholder convention | ✓ |
| Empty string | Render nothing in the cell | |

**User's choice:** Blank/em-dash — (recommended)
**Notes:** Result is D-04/D-05 in CONTEXT.md.

---

## ARPU zero-quantity display

| Option | Description | Selected |
|--------|-------------|----------|
| Em-dash — | Matches Model/Services empty convention and the existing win-rate "—" pattern | ✓ |
| $0 | Treats it as a real zero value | |

**User's choice:** Em-dash — (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, same em-dash rule | Consistent treatment across per-deal and subtotal/grand-total rows | ✓ |
| Subtotal/grand-total rows don't show ARPU at all | FCST-04 only names Quantity/MRR/ARR/Lifetime Contract Value as summed columns | |

**User's choice:** Yes, same em-dash rule (recommended)
**Notes:** Result is D-06/D-07 in CONTEXT.md. Whether ARPU appears at all on subtotal/grand-total rows is left to planner's discretion per FCST-04's literal column list — if included, it must use the em-dash guard.

---

## Breakdown table layout

| Option | Description | Selected |
|--------|-------------|----------|
| 100% → 80% → 50% → Open-to-RFP | Descending confidence, matches CONFIDENCE_WEIGHT mapping order | ✓ |
| Open-to-RFP → 50% → 80% → 100% | Ascending, funnel-style | |

**User's choice:** 100% → 80% → 50% → Open-to-RFP (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Still render, empty state | Matches existing pipeline GroupSection precedent | ✓ |
| Hide entirely | More compact when confidence levels are sparse | |

**User's choice:** Still render, empty state (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| New section below existing stat tiles + charts | Same ForecastPage component, no sub-navigation | ✓ |
| Separate sub-tab within Forecast | New UI pattern not used elsewhere | |

**User's choice:** New section below existing stat tiles + charts (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Always expanded | Simpler, matches FCST-03's "view a table" framing | ✓ |
| Collapsible per confidence group | New interaction not requested | |

**User's choice:** Always expanded (recommended)
**Notes:** Result is D-08/D-09/D-10/D-11 in CONTEXT.md.

---

## Claude's Discretion

- Exact component shape for the Confidence cell (extend `EditableCell` with a variant vs. a new sibling component)
- Whether the breakdown table is a plain HTML table or built on TanStack Table with synthetic subtotal rows
- Whether ARPU appears at all on subtotal/grand-total rows
- Contract Length (months) empty-state treatment — not a genuine gray area since `contractTermMonths` is always populated

## Deferred Ideas

None — discussion stayed within phase scope. No scope-creep suggestions came up.
