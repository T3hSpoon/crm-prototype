---
status: complete
phase: 03-deal-terms-wizard
source: [03-VERIFICATION.md]
started: 2026-09-09T15:55:00.000Z
updated: 2026-09-09T16:15:00.000Z
---

## Current Test

[testing complete]

## Tests

### 1. Open Add Deal, fill step 1 (Name/Company/Value/Owner/Close Date/Stage), click Next
expected: Step 2 renders showing Prorata, Grace Period (days), Contract Term (months), Frequency, Currency — step-1 values are unaffected
result: pass

### 2. From step 2, click Back
expected: Step 1 reappears with every previously entered step-1 value still populated
result: pass

### 3. Fill all 5 step-2 fields, click Create Deal
expected: New deal appears in the pipeline group matching step 1's Stage selection (not gated to Won), with all 5 deal-terms fields carried onto the record
result: pass

### 4. Click "Cancel Add Deal" from step 2, then reopen Add Deal
expected: Dialog closes immediately; on reopen, wizard starts fresh at step 1 with default field values (not step 2, not stale values)
result: pass

### 5. Type 5000 into Grace Period and blur, then attempt Create Deal
expected: Inline FieldError appears ("Grace period must be 3650 days or fewer") and Create Deal is blocked
result: pass

### 6. Click Next on step 1 without touching any step-2 field, then click Create Deal immediately
expected: |
  Human judgment call: the deal is created with Prorata=No, Grace Period=0, Contract Term=0, Frequency=Monthly, Currency=USD — indistinguishable from a deliberately-reviewed choice. Decide whether this is acceptable for Phase 3's scope or requires a follow-up (e.g. touched-state tracking).
  Context: flagged by the plan itself as an unresolved, judgment-tier transparency prohibition (must_haves.prohibitions, status: unresolved) — no wired enforcement exists this phase by design.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
