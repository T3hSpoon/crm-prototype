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

  it("every deal's contractTermMonths is one of the standard 3/6/12/24/36/48/60 lengths", () => {
    const STANDARD_TERMS = [3, 6, 12, 24, 36, 48, 60];
    for (const deal of seedDeals) {
      expect(STANDARD_TERMS).toContain(deal.contractTermMonths);
    }
  });

  it("every Lost deal has a lostReason starting with one of the 5 schema categories; no non-Lost deal has one", () => {
    const CATEGORIES = ["Price", "Timing", "Competitor", "No Budget", "Other"];
    const lostDeals = seedDeals.filter((d) => d.outcome === "lost");
    expect(lostDeals.length).toBeGreaterThan(0);
    for (const deal of lostDeals) {
      expect(deal.lostReason).toBeTruthy();
      const category = deal.lostReason!.split(":")[0].trim();
      expect(CATEGORIES).toContain(category);
    }
    for (const deal of seedDeals.filter((d) => d.outcome !== "lost")) {
      expect(deal.lostReason).toBeUndefined();
    }
  });

  it("at least 2 Won deals are pre-populated with generated documents, so the Documents column isn't uniformly empty on first load", () => {
    const dealsWithDocs = seedDeals.filter((d) => d.documents.length > 0);
    expect(dealsWithDocs.length).toBeGreaterThanOrEqual(2);
    for (const deal of dealsWithDocs) {
      expect(deal.outcome).toBe("won");
      for (const doc of deal.documents) {
        expect(doc.format).toBe("HTML");
        expect(doc.url.startsWith("blob:")).toBe(true);
      }
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

  it("every Won deal has at least 2 'service' line items, so DASH-03's owner-level ARPU always has a real multi-rate set to weight-average over", () => {
    const wonDeals = seedDeals.filter((d) => d.outcome === "won");
    expect(wonDeals.length).toBeGreaterThan(0);
    for (const deal of wonDeals) {
      const serviceCount = deal.lineItems.filter((li) => li.type === "service").length;
      expect(serviceCount).toBeGreaterThanOrEqual(2);
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
