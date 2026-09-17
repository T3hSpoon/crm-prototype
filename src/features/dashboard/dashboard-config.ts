/**
 * Fixed Sales Dashboard config constants (Phase 6). No side effects, no
 * store/repository import — mirrors `forecast-metrics.ts`'s
 * `CONFIDENCE_WEIGHT` constant-module convention, just promoted to its own
 * file since it's shared by both `seed-data.ts` and `dashboard-metrics.ts`.
 */

/**
 * The sole owner-identity source for `Deal.owner` (D-01 — a promote, not an
 * add-alongside: `seed-data.ts`'s previous per-deal `faker.person.fullName()`
 * random-name generator is removed entirely, not kept as a fallback). Every
 * downstream Phase 6 owner-based widget (Leaderboard DASH-03, stacked bar
 * DASH-05) and the `--chart-owner-1..5` color palette (D-03) are keyed to
 * this fixed roster's index order as their primary identity source — never a
 * runtime-sorted array's index, so a given rep's color never changes when a
 * widget re-sorts.
 */
export const OWNER_ROSTER = [
  "Priya Nair",
  "Marcus Webb",
  "Elena Torres",
  "Devon Clarke",
  "Sana Malik",
] as const;

/** D-06 — the historical spread used for backdated lost `closeDate` / won `contractSignedDate` seeding, and the window every Phase 6 time-bucketed widget (DASH-02/DASH-05) covers. */
export const TRAILING_MONTHS = 12;

/**
 * Mock monthly unit-sales target (units/month) — Claude's Discretion per
 * RESEARCH Assumption A2, calibrated so the gauge (DASH-01) and 06-02's
 * monthly Target-vs-Actual chart (DASH-02) sit near 80-110% most months
 * against the finalized 150-deal, `faker.seed(20260917)` dataset.
 */
export const MONTHLY_UNIT_TARGET = 40;

/** DASH-01's gauge target — the trailing-12-month rollup of `MONTHLY_UNIT_TARGET`. */
export const ANNUAL_UNIT_TARGET = MONTHLY_UNIT_TARGET * TRAILING_MONTHS;
