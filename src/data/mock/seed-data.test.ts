import { describe, it, expect } from "vitest";
import { seedDeals, SEED_DEAL_COUNT } from "./seed-data";
import { OWNER_ROSTER, TRAILING_MONTHS } from "@/features/dashboard/dashboard-config";
import { subMonths, startOfDay } from "date-fns";

/**
 * D-01/D-02/D-05/D-06 invariant spot-checks. Because `seed-data.ts` calls
 * `faker.seed(20260917)` before generating `seedDeals`, generation is
 * deterministic — every assertion below is a hard fact about the actual
 * generated dataset, not a probabilistic sample (Task 1's must_haves).
 */

describe("seedDeals", () => {
  it("generates exactly SEED_DEAL_COUNT deals", () => {
    expect(seedDeals.length).toBe(SEED_DEAL_COUNT);
  });

  it("every deal's owner is one of OWNER_ROSTER's 5 fixed values", () => {
    for (const deal of seedDeals) {
      expect(OWNER_ROSTER).toContain(deal.owner);
    }
  });

  it("every OWNER_ROSTER name has at least one Won deal (D-02's Leaderboard-visibility criterion)", () => {
    const wonOwners = new Set(
      seedDeals.filter((d) => d.outcome === "won").map((d) => d.owner),
    );
    for (const owner of OWNER_ROSTER) {
      expect(wonOwners.has(owner)).toBe(true);
    }
  });

  it("every lost deal's closeDate falls within the trailing 12 months up to now (D-05/D-06 backdating)", () => {
    const now = new Date();
    const windowStart = subMonths(now, TRAILING_MONTHS);
    const lostDeals = seedDeals.filter((d) => d.outcome === "lost");
    expect(lostDeals.length).toBeGreaterThan(0);
    for (const deal of lostDeals) {
      const closeDate = new Date(deal.closeDate);
      expect(closeDate.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(closeDate.getTime()).toBeGreaterThanOrEqual(windowStart.getTime());
    }
  });

  it("every open deal's closeDate remains forward-looking (>= now, unchanged)", () => {
    const now = new Date();
    const openDeals = seedDeals.filter((d) => d.outcome === "open");
    expect(openDeals.length).toBeGreaterThan(0);
    for (const deal of openDeals) {
      const closeDate = new Date(deal.closeDate);
      expect(closeDate.getTime()).toBeGreaterThanOrEqual(now.getTime());
    }
  });

  it("every won deal has a contractSignedDate within the trailing 12 months up to now (D-06)", () => {
    // contractSignedDate is intentionally stored as a date-only string
    // (`.slice(0, 10)`), so re-parsing it via `new Date(...)` yields UTC
    // midnight of that calendar day. Comparing that against a
    // precise-timestamp windowStart would spuriously fail whenever the
    // original random instant and the boundary land on the same calendar
    // day (the truncated midnight sits "before" a later time-of-day on that
    // same day) — so this check compares at day granularity via
    // `startOfDay`, matching the field's actual stored precision.
    const now = new Date();
    const windowStart = startOfDay(subMonths(now, TRAILING_MONTHS));
    const wonDeals = seedDeals.filter((d) => d.outcome === "won");
    expect(wonDeals.length).toBeGreaterThan(0);
    for (const deal of wonDeals) {
      expect(deal.contractSignedDate).toBeDefined();
      const signedDate = startOfDay(new Date(deal.contractSignedDate as string));
      expect(signedDate.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(signedDate.getTime()).toBeGreaterThanOrEqual(windowStart.getTime());
    }
  });
});
