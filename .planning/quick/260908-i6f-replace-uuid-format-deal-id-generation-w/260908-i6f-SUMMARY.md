---
phase: 260908-i6f-replace-uuid-format-deal-id-generation-w
plan: 1
subsystem: data
tags: [mock-data, faker, deal-id]

requires: []
provides:
  - "Deal ids (seed data + newly created deals) generated as 10-digit numeric strings instead of UUIDs"
affects: [pipeline-board-ui, forecast]

actuals:
  tokens: 450
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Deal id format: 10-digit numeric string (faker.string.numeric(10) in seed data; a tiny framework-free Math.random()-based generateDealId() helper in the mock repository, kept faker-free to avoid adding a new dependency to that file)"

key-files:
  created: []
  modified:
    - src/data/mock/seed-data.ts
    - src/data/mock/mock-deals-repository.ts

key-decisions:
  - "Kept LineItem id generation untouched (still faker.string.uuid()) — out of scope per plan"
  - "mock-deals-repository.ts got a local generateDealId() helper instead of importing faker, preserving the existing constraint that faker stays confined to the seed-data layer"

patterns-established:
  - "Deal.id stays typed string; format is now a 10-digit numeric string across both generation call sites (seed data and repository create())"

requirements-completed: []

coverage:
  - id: D1
    description: "Seed deals generated at app startup get a 10-digit numeric string id, not a UUID"
    verification:
      - kind: unit
        ref: "grep -c 'id: faker.string.numeric(10)' src/data/mock/seed-data.ts == 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "New deals created via the mock repository's create() get a 10-digit numeric string id, not a UUID"
    verification:
      - kind: unit
        ref: "grep -c 'id: generateDealId()' src/data/mock/mock-deals-repository.ts == 1 and no 'randomUUID' remains"
        status: pass
    human_judgment: false
  - id: D3
    description: "LineItem ids are unaffected — still faker.string.uuid()-generated"
    verification:
      - kind: unit
        ref: "grep -c 'id: faker.string.uuid()' src/data/mock/seed-data.ts == 1"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-08
status: complete
---

# Quick Task 260908-i6f: Replace UUID-format Deal id generation with 10-digit numeric strings Summary

**Deal ids now render as 10-digit numeric strings (e.g. `3206893803`) at both generation call sites — seed data and the mock repository's `create()` — while LineItem ids remain untouched UUIDs.**

## Performance

- **Duration:** ~5 min
- **Completed:** 2026-09-08T10:09:27Z
- **Tasks:** 2/2 completed
- **Files modified:** 2

## Accomplishments
- `buildSeedDeal()` in `seed-data.ts` now sets `Deal.id` via `faker.string.numeric(10)` instead of `faker.string.uuid()`; updated the `seedDeals` doc comment to reflect the two distinct id formats (Deal: numeric, LineItem: UUID).
- Added a small framework-free `generateDealId()` helper to `mock-deals-repository.ts` (loops 10 times building a random-digit string via `Math.random()`) and wired it into `create()`, replacing the `crypto.randomUUID()` call. No faker import was added to this file.
- `LineItem` id generation (`faker.string.uuid()` in `buildSeedLineItem()`) is completely unchanged.
- `Deal.id` in `shared/types/deal.ts` stays typed `string` — no type changes made anywhere.

## Task Commits

Each task was committed atomically:

1. **Task 1: Switch Deal id seed generation from UUID to 10-digit numeric string** - `cc7cd4d` (feat)
2. **Task 2: Replace UUID-based Deal id generation in mock repository's create()** - `55653a8` (feat)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reworded doc comment in `mock-deals-repository.ts` to avoid the literal string "randomUUID"**
- **Found during:** Task 2 verification
- **Issue:** The initial doc comment above `generateDealId()` referenced `crypto.randomUUID()` by name, which caused the plan's own verify command (`! grep -q 'randomUUID' ...`) to fail — the string was present in a comment, not just in removed code.
- **Fix:** Reworded the comment to say "Web Crypto UUID-based id assignment" instead of naming the API literally, preserving the explanatory intent without the literal string.
- **Files modified:** `src/data/mock/mock-deals-repository.ts`
- **Commit:** `55653a8` (included in the Task 2 commit, not a separate commit — caught before commit)

## Self-Check: PASSED

- FOUND: src/data/mock/seed-data.ts
- FOUND: src/data/mock/mock-deals-repository.ts
- FOUND: cc7cd4d
- FOUND: 55653a8
