---
status: complete
phase: 04-forecast-pipeline-analysis
source: [04-VERIFICATION.md]
started: 2026-09-15T12:00:00Z
updated: 2026-09-15T12:12:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Live search across all 6 stage tables
expected: Type a partial deal name or company fragment into the toolbar search box. Matching rows stay visible and non-matching rows disappear across all 6 group sections at once; each affected group's count badge/$ total updates to reflect only the visible rows; typing an owner's name (not matching any deal name/company) filters nothing; clearing the box restores all rows and totals.
result: pass

### 2. Owner/value/close-date filters + inline validation
expected: Select an owner from the dropdown; set an invalid value-min > value-max; set an invalid close-date-max before close-date-min. Owner filter narrows every group to that owner's deals; the value-range pair shows "Enter a valid range." beneath the inputs and applies no value constraint; the close-date pair shows "End date must be on or after the start date." and applies no date constraint.
result: pass

### 3. Column sorting, synchronized across tables
expected: Click a group's Value, Owner, and Close Date column headers. An ascending/descending arrow appears on the active sort column; all 6 groups reorder together, synchronized; clicking again flips direction and the arrow.
result: pass

### 4. Group-visibility toggle + Clear filters
expected: Uncheck "Won" and "Lost" pills in the group-visibility toggle, then uncheck every pill, then click "Clear filters" after setting several filters. Unchecking two pills hides only those two sections; unchecking all pills shows "No pipeline stages selected. / Choose at least one stage above to see deals."; "Clear filters" resets search, owner, value/date ranges, sort arrows, and re-enables all 6 pills in one click.
result: pass

### 5. Forecast tab tiles + tab-switch state persistence
expected: Open the Forecast tab and confirm the 3 stat tiles show real numbers; switch to Pipeline, set a search/filter/sort or expand a line-item row, switch to Forecast and back. Raw Pipeline Value, Weighted Value, and Win Rate render plausible, correctly-labeled numbers; the Pipeline tab's search/filter/sort/expanded-row state is unchanged after the round trip (both views stay mounted).
result: pass

### 6. CR-01 fix: no stale lostReason across a Lost→Prospect→Lost round trip
expected: Mark a deal Lost, move it back to an active stage, then mark it Lost again with a different reason category; observe the Lost Deals by Reason chart. Only the latest lostReason is ever reflected in the chart — no stale double-count under the old category.
result: pass

### 7. Chart tooltip, dark-mode colors, empty state
expected: Hover a bar on each chart; add/observe a lost deal with a note; toggle a `dark` class on `<html>` via devtools; view the charts with zero lost deals. Tooltip shows a plain count, never a dollar figure; a new lost deal increments the correct category bar without adding a bar for its free-text note; bar/gridline colors flip to the dark-mode hex values; zero lost deals shows "No lost deals recorded yet — this chart fills in once a deal is marked Lost." in place of an empty axis.
result: pass

### 8. Win Rate tile with zero closed deals
expected: Confirm the Win Rate tile before any deal has reached Won/Lost (e.g. on a fresh/filtered dataset with 0 closed deals). Tile reads "— " with caption "No closed deals yet." — never "0%" or "NaN%".
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
