---
phase: add-deal-accounts-directory
plan: 1
subsystem: ui
tags: [react, react-hook-form, zod, zustand, shadcn, mock-data]

requires:
  - phase: 03-deal-terms-wizard
    provides: AddDealDialog step 1's Select pattern (Field/FieldLabel/SelectTrigger/SelectContent/SelectItem) reused for the Company/Prime Group/Address/Contact fields
provides:
  - "accounts-directory.ts — hand-written, non-faker mock ACCOUNTS_DIRECTORY of 6 fictional companies, each with 2-3 Prime Groups (location/depot), each with an address and 1-2 contacts"
  - "getCompanyNames()/getPrimeGroupsForCompany() lookup helpers"
  - "Add Deal modal step 1: Company converted from free-text Input to a Select; new cascading Prime Group -> Address -> Contact Selects"
  - "Deal.primeGroup/address/contact (optional) and NewDealInput.primeGroup/address/contact (required)"
affects: [pipeline, add-deal-wizard]

actuals:
  tokens: unknown
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Hand-written static mock reference data, deliberately NOT faker-generated, to avoid perturbing seed-data.ts's faker.seed(20260917) determinism"
    - "Cascading Select fields (Company -> Prime Group -> Address/Contact) with onValueChange resetting all downstream fields, and disabled+placeholder gating until the upstream field is chosen"

key-files:
  created:
    - src/data/mock/accounts-directory.ts
    - src/data/mock/accounts-directory.test.ts
  modified:
    - src/shared/types/deal.ts
    - src/features/pipeline/components/add-deal-schema.ts
    - src/features/pipeline/components/AddDealDialog.tsx
    - src/data/mock/mock-deals-repository.ts

key-decisions:
  - "Deal.primeGroup/address/contact are OPTIONAL — the 150 existing faker-generated seed deals predate this concept and are intentionally not backfilled; NewDealInput's same 3 fields are REQUIRED since the wizard mandates picking all 3 for every new deal"
  - "Address and Contact are still real Selects (not plain text) even though Address effectively resolves to a single option per Prime Group — matches the user's explicit ask that all 4 fields be dropdowns"
  - "One account uses 'MTM' as the company name with 'Manteca Depot' as a Prime Group, echoing the real Idrive 'MTM Manteca' purchase-quote reference used earlier in this project's seed/document work"

patterns-established:
  - "New closed-set reference/lookup mock data for this prototype should be a hand-written static file, never faker-generated, to protect seed-data.ts's shared faker RNG determinism"

requirements-completed: []

coverage:
  - id: D1
    description: "Add Deal modal step 1 shows Company as a dropdown of ACCOUNTS_DIRECTORY company names"
    verification:
      - kind: other
        ref: "npx tsc -b; npm run build"
        status: pass
    human_judgment: true
    rationale: "Visual rendering and interaction not covered by a browser smoke test — no browser available in this autonomous worktree session."
  - id: D2
    description: "Selecting a Company populates Prime Group options to that company's locations; selecting Prime Group populates Address/Contact to that location's own values; changing Company resets Prime Group/Address/Contact, changing Prime Group resets Address/Contact"
    verification:
      - kind: other
        ref: "npx tsc -b (type-level proof of the cascade wiring)"
        status: pass
    human_judgment: true
    rationale: "Cascade/reset runtime behavior not covered by an automated test — this project doesn't unit-test React components."
  - id: D3
    description: "Submitting a new deal persists primeGroup/address/contact onto the created Deal via MockDealsRepository.create()'s direct pass-through"
    verification:
      - kind: other
        ref: "npx tsc -b; npm run build"
        status: pass
    human_judgment: true
    rationale: "End-to-end create flow not covered by an automated test."
  - id: D4
    description: "accounts-directory.ts structural invariants hold (2-3 prime groups/account, 1-2 contacts/prime group, non-empty addresses, unique company names, MTM/Manteca Depot present); seed-data.ts untouched, faker determinism unaffected"
    verification:
      - kind: test
        ref: "npx vitest run src/data/mock/accounts-directory.test.ts"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-09-21
status: complete
---

# Quick Task 260921-f5a: Add Deal Accounts Directory Cascade Summary

**Converted the Add Deal modal's free-text Company field into a dropdown and added cascading Prime Group / Address / Contact dropdowns, sourced from a new hand-written mock accounts directory (Prime Group = internal org directory grouping units by location).**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2 completed
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- `accounts-directory.ts`: hand-written, never-faker-generated static directory of 6 fictional trucking/fleet companies (`Account -> AccountPrimeGroup -> AccountContact`), including an "MTM" account with a "Manteca Depot" Prime Group. `getCompanyNames()`/`getPrimeGroupsForCompany()` exported.
- `accounts-directory.test.ts`: 6 tests proving every account has 2-3 prime groups, every prime group has a non-empty address and 1-2 contacts, all 6 company names are unique, and both helper functions behave correctly (including the MTM/Manteca Depot and unknown-company cases).
- `shared/types/deal.ts`: `Deal.primeGroup/address/contact` added as optional (150 existing seed deals stay unset, no backfill); `NewDealInput.primeGroup/address/contact` added as required.
- `add-deal-schema.ts`: `addDealStep1Schema` widened from 6 to 9 required fields.
- `AddDealDialog.tsx`: Company converted from free-text `Input` to a `Select` sourced from `getCompanyNames()`; three new cascading `Select`s (Prime Group -> Address -> Contact) added right after Company, each disabled/placeholder-gated until its upstream field is chosen, resetting downstream fields on upstream change; `handleNext`'s validation and `DEFAULT_VALUES` updated to include the 3 new fields.
- `mock-deals-repository.ts`: `create()` passes `primeGroup`/`address`/`contact` through untransformed, mirroring the existing prorata/frequency/currency pass-through pattern.

## Task Commits

Each task was committed atomically:

1. **Task 1: accounts-directory.ts + Deal/NewDealInput/schema/repository wiring + AddDealDialog cascade** - `b54d0d5` (feat)
2. **Task 2: accounts-directory.test.ts structural invariants** - `c6ccb8c` (test)

Merged into master via `72cf08e` (the worktree diverged from a manual STATE.md commit the user made mid-session; merge was clean, no conflicts).

## Files Created/Modified

- `src/data/mock/accounts-directory.ts` - Static Company -> Prime Group -> Contact directory + lookup helpers
- `src/data/mock/accounts-directory.test.ts` - Structural invariant tests
- `src/shared/types/deal.ts` - `Deal`/`NewDealInput` widened with primeGroup/address/contact
- `src/features/pipeline/components/add-deal-schema.ts` - `addDealStep1Schema` widened to 9 fields
- `src/features/pipeline/components/AddDealDialog.tsx` - Company Select + cascading Prime Group/Address/Contact Selects
- `src/data/mock/mock-deals-repository.ts` - `create()` direct pass-through for the 3 new fields

## Decisions Made

- `seed-data.ts` left untouched per explicit scope — no backfill, no faker calls, to protect `faker.seed(20260917)` determinism for the 150 existing deals.
- `DealTable.tsx`/`DealTermsDialog.tsx`/`pipelineStore.updateDeal` intentionally not touched — these 3 fields are create-only via the Add Deal modal per this task's scope; no display column or post-creation edit affordance was added.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- The executor ran in an isolated git worktree; merging it back hit a `base_mismatch` in the automated cleanup tool because the user had made an unrelated manual commit (`0c36717`, editing `.planning/STATE.md`) on `master` while the executor was running, advancing `master` past the worktree's fork point. Resolved with a manual `git merge --no-ff` (clean, no file conflicts — the manual commit only touched STATE.md) instead of the automated cleanup path.
- The worktree directory was removed with `git worktree remove --force` after the merge, which also deleted an untracked `260921-f5a-SUMMARY.md` the executor had written inside the worktree (per this task's constraint, SUMMARY.md was intentionally left uncommitted for the orchestrator to handle, so it existed only as an untracked file inside the now-removed worktree). This file was reconstructed from the executor's final handback report.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `npx tsc -b`, `npm run build`, and `npx vitest run` (72/72 tests: 66 pre-existing + 6 new) all pass.
- Manual browser smoke test (open Add Deal, pick a Company, confirm Prime Group options populate, pick one, confirm Address/Contact populate, change Company and confirm the cascade resets) was not run — no browser available in the autonomous worktree session. Flagged in `coverage` above as `human_judgment: true` for D1-D3.

## Self-Check: PASSED

All 6 files (2 created, 4 modified) verified present on disk; both task commits (`b54d0d5`, `c6ccb8c`) verified present in `git log`; merge commit `72cf08e` verified on `master`.

---
*Quick task: 260921-f5a*
*Completed: 2026-09-21*
