---
phase: 06-sales-dashboard
fixed_at: 2026-09-17T00:00:00Z
review_path: .planning/phases/06-sales-dashboard/06-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 6: Code Review Fix Report

**Fixed at:** 2026-09-17
**Source review:** .planning/phases/06-sales-dashboard/06-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (2 critical, 1 warning; fix_scope: critical_warning — Info findings IN-01/IN-02 excluded)
- Fixed: 3
- Skipped: 0

## Fixed Issues

### CR-01: `UnitTargetGauge`'s radial gauge always renders as 100% full, regardless of actual progress

**Files modified:** `src/features/dashboard/components/UnitTargetGauge.tsx`
**Commit:** `c3546c7`
**Applied fix:** Added an explicit `<PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />` inside `RadialBarChart`, matching the review's suggested fix exactly. Without it, recharts fell back to an implicit `[0, dataMax]` domain with a single data point, so the value was always mapped to 100% of the sweep. Verified by re-reading the file and a scoped `tsc --noEmit` pass on the modified file (no errors).

### CR-02: Owner-keyed dashboard metrics silently break for any deal whose `owner` isn't one of the 5 hardcoded `OWNER_ROSTER` names

**Files modified:** `src/features/dashboard/dashboard-metrics.ts`
**Commit:** `121ae73`
**Applied fix:** Chose option (b) from the review's fix guidance (defensive aggregation) over option (a) (app-wide `owner` field lockdown), since it is the narrower, lower-risk change confined to the two aggregation functions already cited, and the review supplied ready-to-adapt code for it. `computeOwnerLeaderboard` now skips (`continue`) any deal whose `owner` isn't already a pre-seeded roster key, instead of inserting a 6th+ `Map` entry. `computeClosedByOwnerPerMonth` now skips any deal whose `owner` isn't in the `owners` list before writing to `bucket[deal.owner]`, preventing both the "stray property no `<Bar dataKey>` renders" silent-drop case and the sharper `"key"`/`"month"` name-collision case that would corrupt the row's own bookkeeping fields. Note: option (a) (constraining `AddDealDialog`'s `owner` input to a `<Select>` bound to `OWNER_ROSTER` and removing `"owner"` from `EditableCell`'s free-text columns) remains a valid follow-up if the product intent is truly "owner is a closed set" rather than "aggregations should tolerate stray owner values" — flagging for a human decision since it touches files outside this review's cited scope (`AddDealDialog.tsx`, `EditableCell.tsx`, `pipelineStore.ts`). Verified by re-reading both edited call sites, a scoped `tsc --noEmit` pass (no errors), and a deliberate-error sanity check confirming the type checker was actually exercising the file.

### WR-01: `contractSignedDate` bucketing can land in the wrong month depending on the viewer's timezone

**Files modified:** `src/features/dashboard/dashboard-metrics.ts`
**Commit:** `be215f0`
**Applied fix:** Imported `parseISO` from `date-fns` and replaced `new Date(...)` with `parseISO(...)` at both call sites the review cited: `computeMonthlyWonUnits`'s `contractSignedDate` bucketing (line ~86 pre-fix) and `computeClosedByOwnerPerMonth`'s combined `contractSignedDate`/`closeDate` bucketing (line ~209 pre-fix). For the `computeClosedByOwnerPerMonth` case, applied `parseISO` uniformly to both branches rather than conditionally per-outcome: `closeDate` is a full ISO datetime, which `parseISO` parses identically to `new Date` (both honor an explicit offset/`Z`), so a single uniform fix is safe and simpler than branching. This resolves the UTC-vs-local-timezone month-misattribution bug for date-only `contractSignedDate` strings without touching `closeDate` semantics. Verified by re-reading the modified code and a scoped `tsc --noEmit` pass (no errors).

## Skipped Issues

None — all in-scope findings were fixed.

## Notes on Excluded (Info-tier) Findings

Per `fix_scope: critical_warning`, IN-01 (unused `--chart-1..5` CSS custom properties) and IN-02 (duplicated "won deals" filter predicate in `DashboardPage`) were left untouched. Both remain open in `06-REVIEW.md` for a future `fix_scope: all` pass if desired.

## Verification Environment

All fixes were applied and verified in an isolated git worktree (`.claude/worktrees/rf-06-14663-1789656719`, branch `gsd-reviewfix/06-14663`, forked from `master`) to avoid racing the foreground session on the main working tree. The worktree had no `node_modules`; `npx tsc --noEmit -p tsconfig.app.json` resolved TypeScript 5.9.3 via npx's own cache and was confirmed to genuinely type-check the target files (a deliberately injected type error was caught and then reverted before proceeding). Commits made in the worktree were fast-forwarded onto `master` as part of the standard cleanup tail. `gsd_run query commit` could not be used for the source-file commits in this run — the installed `gsd-core` version's `commit_docs` policy check (`resolveCommitDocsPolicy`) skips **all** commits when `commit_docs: false` and no `phase_commit_docs` override exists for phase 6, not just commits touching `.planning/` files, contradicting this run's stated expectation. Plain `git commit` (hooks enabled, no `--no-verify`) was used instead for the three source-file commits, each carrying the `fix(06): {id} ...` conventional message and the standard attribution trailer. This REVIEW-FIX.md itself is intentionally left uncommitted per `commit_docs: false` — the orchestrator commits it.

---

_Fixed: 2026-09-17_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
