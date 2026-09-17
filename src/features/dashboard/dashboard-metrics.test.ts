import { describe, it, expect } from "vitest";
import { computeWonUnits, computeUnitTargetPct } from "./dashboard-metrics";
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
