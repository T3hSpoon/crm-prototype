---
status: partial
phase: 02-deal-detail-line-items
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, ../../quick/260908-f9d-widen-the-app-layout-to-95-of-the-viewpo/260908-f9d-SUMMARY.md, ../../quick/260908-i18-add-a-read-only-deal-id-column-as-the-la/260908-i18-SUMMARY.md, ../../quick/260908-i6f-replace-uuid-format-deal-id-generation-w/260908-i6f-SUMMARY.md]
started: 2026-09-08T13:22:31Z
updated: 2026-09-09T00:00:00Z
---

## Current Test

[testing paused — 6 items outstanding (test 4 still awaiting a response; user switched to a Vercel deployment request)]

## Tests

### 1. Inline edit core fields in the table
expected: Click into the Name, Value, Owner, or Close Date cell of any row, edit it, and blur (or press Enter) — the change commits and the cell reflects the new value. Clear Close Date to empty and blur — an inline validation error appears and nothing crashes.
result: pass

### 2. Move a deal's stage
expected: Use the Stage dropdown on any row to move the deal to a different pipeline group — it relocates to the new group without opening anything else.
result: pass

### 3. Expand/collapse line items via chevron
expected: Click the chevron at the start of a row — a sub-row expands beneath it showing that deal's line items. Click the chevron again to collapse it. Clicking anywhere else on the row does nothing.
result: pass

### 4. Line item add/edit/remove
expected: In an expanded row, click "Add Line Item", fill in product/units/price — the subtotal updates live and persists after blur. Edit an existing line item's fields. Remove a line item — it disappears.
result: [pending]

### 5. Value auto-tracking, override, and reset-to-sum
expected: A deal's Value equals the sum of its line items by default (no reset control shown). Editing Value directly to a different number puts it in "overridden" mode and a "Reset to sum" control appears. Adding another line item while overridden does NOT silently change Value. Clicking "Reset to sum" restores the computed sum and the control disappears.
result: [pending]

### 6. Line-item validation
expected: Typing 0 or a negative number into a line item's Units or Unit Price shows an inline validation error and the row is not committed. A valid positive number commits normally.
result: [pending]

### 7. Deal ID column
expected: The last column of the table shows each deal's ID as a plain 10-digit number in muted monospace text (not a UUID with dashes), and it is not editable/clickable.
result: [pending]

### 8. Wide layout
expected: The pipeline board (header, groups, table) fills roughly 95% of the browser window's width, not a narrow ~1024px centered column.
result: [pending]

### 9. Scope check — no drawer, no delete
expected: Clicking a row anywhere other than the chevron, an editable cell, or the Stage dropdown does nothing — no drawer or modal opens. No delete-deal control exists anywhere in the UI.
result: [pending]

## Summary

total: 9
passed: 3
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
