import { describe, it, expect } from "vitest";
import { format, startOfMonth, subMonths } from "date-fns";
import {
  computeWonUnits,
  computeUnitTargetPct,
  computeMonthlyWonUnits,
  computeOwnerLeaderboard,
} from "./dashboard-metrics";
import { OWNER_ROSTER, MONTHLY_UNIT_TARGET } from "@/features/dashboard/dashboard-config";
import type { Deal, LineItem } from "@/shared/types/deal";

function lineItem(overrides: Partial<LineItem>): LineItem {
  return {
    id: overrides.id ?? "li-1",
    productOrService: overrides.productOrService ?? "Support",
    sku: overrides.sku ?? "SKU-1",
    units: overrides.units ?? 1,
    unitPrice: overrides.unitPrice ?? 1,
    type: overrides.type ?? "service",
  };
}

function deal(overrides: Partial<Deal>): Deal {
  return {
    id: overrides.id ?? "deal-1",
    name: overrides.name ?? "Deal",
    company: overrides.company ?? "Acme",
    value: overrides.value ?? 1000,
    owner: overrides.owner ?? "Owner",
    closeDate: overrides.closeDate ?? "2026-01-01",
    pipelineStage: overrides.pipelineStage ?? "prospect",
    outcome: overrides.outcome ?? "open",
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
    lineItems: overrides.lineItems ?? [],
    prorata: overrides.prorata ?? false,
    gracePeriodDays: overrides.gracePeriodDays ?? 0,
    contractTermMonths: overrides.contractTermMonths ?? 12,
    frequency: overrides.frequency ?? "monthly",
    currency: overrides.currency ?? "USD",
    customerType: overrides.customerType ?? "similar",
    confidenceLevel: overrides.confidenceLevel ?? "100",
    ...overrides,
  };
}

describe("computeWonUnits", () => {
  it("returns 0 for an empty deals array", () => {
    expect(computeWonUnits([])).toBe(0);
  });

  it("sums units across ALL line items (product + service, not service-only) of Won deals", () => {
    const won = deal({
      id: "won-1",
      outcome: "won",
      lineItems: [
        lineItem({ type: "product", units: 3 }),
        lineItem({ type: "service", units: 4 }),
      ],
    });

    expect(computeWonUnits([won])).toBe(7);
  });

  it("excludes open and lost deals — only outcome === 'won' contributes", () => {
    const open = deal({ id: "open-1", outcome: "open", lineItems: [lineItem({ units: 10 })] });
    const lost = deal({ id: "lost-1", outcome: "lost", lineItems: [lineItem({ units: 10 })] });
    const won = deal({ id: "won-1", outcome: "won", lineItems: [lineItem({ units: 5 })] });

    expect(computeWonUnits([open, lost, won])).toBe(5);
  });

  it("is order-invariant — shuffling the input array yields the identical total", () => {
    const dealA = deal({
      id: "a",
      outcome: "won",
      lineItems: [lineItem({ id: "a1", units: 3 })],
    });
    const dealB = deal({
      id: "b",
      outcome: "won",
      lineItems: [lineItem({ id: "b1", units: 5 })],
    });
    const dealC = deal({
      id: "c",
      outcome: "won",
      lineItems: [lineItem({ id: "c1", units: 2 })],
    });

    expect(computeWonUnits([dealA, dealB, dealC])).toBe(
      computeWonUnits([dealC, dealA, dealB]),
    );
  });
});

describe("computeUnitTargetPct", () => {
  it("returns 0 when target === 0 (never NaN/Infinity)", () => {
    expect(computeUnitTargetPct(0, 0)).toBe(0);
    expect(computeUnitTargetPct(50, 0)).toBe(0);
  });

  it("returns exactly 1 when actual === target", () => {
    expect(computeUnitTargetPct(40, 40)).toBe(1);
  });

  it("clamps to exactly 1 when actual > target (never overflows past 100%)", () => {
    expect(computeUnitTargetPct(80, 40)).toBe(1);
  });

  it("returns actual / target when actual < target", () => {
    expect(computeUnitTargetPct(20, 40)).toBe(0.5);
  });
});

describe("computeMonthlyWonUnits", () => {
  it("always returns exactly 12 entries, even when every deal is non-Won (all buckets zero)", () => {
    const open = deal({ id: "open-1", outcome: "open", lineItems: [lineItem({ units: 10 })] });
    const result = computeMonthlyWonUnits([open]);

    expect(result).toHaveLength(12);
    expect(result.every((bucket) => bucket.actual === 0)).toBe(true);
  });

  it("returns exactly 12 entries for an empty deals array", () => {
    expect(computeMonthlyWonUnits([])).toHaveLength(12);
  });

  it("pre-seeds every bucket with the configured MONTHLY_UNIT_TARGET", () => {
    const result = computeMonthlyWonUnits([]);
    expect(result.every((bucket) => bucket.target === MONTHLY_UNIT_TARGET)).toBe(true);
  });

  it("buckets a Won deal's line-item units into its contractSignedDate month, leaving other months at explicit 0 (never omitted)", () => {
    const thisMonthKey = format(startOfMonth(new Date()), "yyyy-MM");
    const won = deal({
      id: "won-1",
      outcome: "won",
      contractSignedDate: new Date().toISOString().slice(0, 10),
      lineItems: [
        lineItem({ type: "product", units: 4 }),
        lineItem({ type: "service", units: 3 }),
      ],
    });

    const result = computeMonthlyWonUnits([won]);
    const currentBucket = result.find((bucket) => bucket.key === thisMonthKey);
    const otherBuckets = result.filter((bucket) => bucket.key !== thisMonthKey);

    expect(currentBucket?.actual).toBe(7);
    expect(otherBuckets).toHaveLength(11);
    expect(otherBuckets.every((bucket) => bucket.actual === 0)).toBe(true);
  });

  it("excludes open and lost deals from every bucket's actual, even when they carry a contractSignedDate-shaped closeDate", () => {
    const lost = deal({
      id: "lost-1",
      outcome: "lost",
      closeDate: new Date().toISOString().slice(0, 10),
      lineItems: [lineItem({ units: 99 })],
    });

    const result = computeMonthlyWonUnits([lost]);
    expect(result.every((bucket) => bucket.actual === 0)).toBe(true);
  });

  it("a Won deal signed 3 months ago lands in that trailing month's bucket, not the current month", () => {
    const threeMonthsAgo = subMonths(startOfMonth(new Date()), 3);
    const key = format(threeMonthsAgo, "yyyy-MM");
    const won = deal({
      id: "won-old",
      outcome: "won",
      contractSignedDate: threeMonthsAgo.toISOString().slice(0, 10),
      lineItems: [lineItem({ units: 6 })],
    });

    const result = computeMonthlyWonUnits([won]);
    const bucket = result.find((b) => b.key === key);
    expect(bucket?.actual).toBe(6);
  });
});

describe("computeOwnerLeaderboard", () => {
  it("always returns exactly 5 entries — one per OWNER_ROSTER name — even for an empty deals array", () => {
    const result = computeOwnerLeaderboard([]);
    expect(result).toHaveLength(5);
    expect(result.map((e) => e.owner).sort()).toEqual([...OWNER_ROSTER].sort());
    expect(result.every((e) => e.wonValue === 0)).toBe(true);
  });

  it("an owner with zero Won deals still appears with wonValue: 0 (never omitted)", () => {
    const won = deal({ id: "won-1", outcome: "won", owner: OWNER_ROSTER[0], value: 5000 });
    const result = computeOwnerLeaderboard([won]);

    expect(result).toHaveLength(5);
    const zeroOwners = result.filter((e) => e.owner !== OWNER_ROSTER[0]);
    expect(zeroOwners).toHaveLength(4);
    expect(zeroOwners.every((e) => e.wonValue === 0)).toBe(true);
  });

  it("sums Won-deal value per owner and excludes open/lost deals", () => {
    const wonA1 = deal({ id: "a1", outcome: "won", owner: OWNER_ROSTER[0], value: 1000 });
    const wonA2 = deal({ id: "a2", outcome: "won", owner: OWNER_ROSTER[0], value: 2000 });
    const openA = deal({ id: "a3", outcome: "open", owner: OWNER_ROSTER[0], value: 9999 });
    const lostA = deal({ id: "a4", outcome: "lost", owner: OWNER_ROSTER[0], value: 9999 });

    const result = computeOwnerLeaderboard([wonA1, wonA2, openA, lostA]);
    const entry = result.find((e) => e.owner === OWNER_ROSTER[0]);
    expect(entry?.wonValue).toBe(3000);
  });

  it("is sorted descending by wonValue", () => {
    const low = deal({ id: "low", outcome: "won", owner: OWNER_ROSTER[1], value: 100 });
    const high = deal({ id: "high", outcome: "won", owner: OWNER_ROSTER[3], value: 900 });
    const mid = deal({ id: "mid", outcome: "won", owner: OWNER_ROSTER[4], value: 500 });

    const result = computeOwnerLeaderboard([low, high, mid]);
    const values = result.map((e) => e.wonValue);
    const sorted = [...values].sort((a, b) => b - a);
    expect(values).toEqual(sorted);
  });
});
