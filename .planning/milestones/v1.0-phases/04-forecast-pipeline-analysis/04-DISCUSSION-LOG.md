# Phase 4: Forecast & Pipeline Analysis - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-15
**Phase:** 4-Forecast & Pipeline Analysis
**Areas discussed:** Forecast page navigation, Search/filter/sort scope, Pipeline value & win rate formulas, Lost/Won stale-field cleanup (CR-01)

---

## Forecast page navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Simple tab/toggle | Local view-state swapping between PipelineBoard and a new ForecastPage, no new dependency | ✓ |
| Add react-router | URL-based routes with browser back/forward + shareable URLs | |
| You decide | | |

**User's choice:** Simple tab/toggle (recommended)
**Notes:** No router installed today; matches CLAUDE.md's "zero routing needs, plain SPA" framing.

| Option | Description | Selected |
|--------|-------------|----------|
| Top-level tabs above the board | Replace the "Pipeline" h1 header row with a tab bar, reuse the 95%-width shell | ✓ |
| Separate full-width forecast layout | Forecast page ignores the 95%-width convention, own dashboard layout | |
| You decide | | |

**User's choice:** Top-level tabs above the board (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve state | Pipeline board stays mounted/state survives tab switch | ✓ |
| Reset on tab switch | Pipeline board unmounts, search/filter/sort/expanded rows reset each time | |
| You decide | | |

**User's choice:** Preserve state (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Pipeline-only | Forecast page has no Add Deal button, read-only analysis | ✓ |
| Show Add Deal everywhere | Add Deal button appears in both tabs' header | |
| You decide | | |

**User's choice:** Pipeline-only (recommended)

---

## Search/filter/sort scope

| Option | Description | Selected |
|--------|-------------|----------|
| Filter/sort within each group | Each of the 6 GroupSection tables keeps its own rows/sorting, filters hide non-matching rows per group | ✓ |
| Flatten into one single table | Collapse all 6 groups into one flat table | |
| You decide | | |

**User's choice:** Filter/sort within each group (recommended)
**Notes:** Preserves the grouped-board visual identity from Phase 1.

| Option | Description | Selected |
|--------|-------------|----------|
| One shared toolbar above the board | Single search/filter controls in PipelineBoard's header, state passed to all groups | ✓ |
| Per-group toolbar | Each GroupSection gets its own independent controls | |
| You decide | | |

**User's choice:** One shared toolbar above the board (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Group visibility toggle | Stage filter is a multi-select that shows/hides entire GroupSection blocks | ✓ |
| Filter by original pipelineStage even inside Lost/Won | Stage filter matches pipelineStage regardless of outcome | |
| You decide | | |

**User's choice:** Group visibility toggle (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Clickable column headers | Click Value/Close Date/Owner header to sort, same sort applies to all 6 groups | ✓ |
| Separate sort dropdown | "Sort by" dropdown + asc/desc toggle in the toolbar | |
| You decide | | |

**User's choice:** Clickable column headers (recommended)

---

## Pipeline value & win rate formulas

| Option | Description | Selected |
|--------|-------------|----------|
| Open deals only | Sum `value` across outcome === "open" deals only | ✓ |
| All deals including Won/Lost | Sum `value` across every deal regardless of outcome | |
| You decide | | |

**User's choice:** Open deals only (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| value × confidence weight, summed over open deals | Weighted value = Σ(value × confidenceWeight) for open deals, using the locked 1.0/0.8/0.5/0.0 mapping | ✓ |
| value × confidence weight, summed over ALL deals | Same formula but also includes Won/Lost | |
| You decide | | |

**User's choice:** value × confidence weight, summed over open deals (recommended)
**Notes:** Confidence Level → weight mapping was already locked in a prior session (STATE.md, 2026-09-10) — not re-litigated here.

| Option | Description | Selected |
|--------|-------------|----------|
| won / (won + lost) | Conventional win-rate definition, excludes still-open deals | ✓ |
| won / all deals (including open) | Divides won count by total deal count regardless of outcome | |
| You decide | | |

**User's choice:** won / (won + lost) (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Recharts bar charts | Install recharts for lost-by-reason/lost-by-stage bar charts + stat tiles | ✓ |
| Plain tables/numbers, no chart library | Simple HTML tables/stat lists, no new dependency | |
| You decide | | |

**User's choice:** Recharts bar charts (recommended)

---

## Lost/Won stale-field cleanup (CR-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Fix it now, as part of Phase 4 | Update moveStage/moveToLost/moveToWon to clear stale opposing-terminal-state fields | ✓ |
| Leave it deferred — FCST-02 just filters by current outcome | Don't touch the store actions; rely on forecast queries filtering by outcome | |
| You decide | | |

**User's choice:** Fix it now, as part of Phase 4 (recommended)
**Notes:** Explicitly flagged in STATE.md/03.1-REVIEW.md CR-01 as something to resolve before FCST-02 consumes lostReason/contract-term data.

| Option | Description | Selected |
|--------|-------------|----------|
| Centralize in one place, all three actions covered | A shared helper returns the clear-patch for a target group; moveStage/moveToLost/moveToWon all call it | ✓ |
| Only fix moveStage | moveToLost/moveToWon left as-is | |
| You decide | | |

**User's choice:** Centralize in one place, all three actions covered (recommended)

---

## Claude's Discretion

- Exact implementation mechanism for preserving Pipeline board state across tab switches (Zustand slice vs. lifted local state vs. hidden-but-mounted component)
- Exact shape/location of search/filter state (single object vs. several useState, store vs. new hook)
- Exact Recharts chart styling/stat-tile layout beyond "bar charts + stat tiles"
- Exact helper name/location for the stale-field clear-patch logic (recommended: alongside `fromPipelineGroup` in `pipeline-group.ts`)

## Deferred Ideas

None — discussion stayed within phase scope.
