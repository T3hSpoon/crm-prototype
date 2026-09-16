import { describe, it, expect } from "vitest";
import { groupDealsByConfidence, computeGroupTotals } from "./forecast-breakdown";
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

describe("groupDealsByConfidence", () => {
  it("groups ALL outcomes (not just open) and always includes all 4 keys, even empty", () => {
    const dealA = deal({ id: "a", confidenceLevel: "50", outcome: "lost" });
    const dealB = deal({ id: "b", confidenceLevel: "100", outcome: "open" });

    const result = groupDealsByConfidence([dealA, dealB]);

    expect(result["50"]).toEqual([dealA]);
    expect(result["100"]).toEqual([dealB]);
    expect(result["80"]).toEqual([]);
    expect(result["open-to-rfp"]).toEqual([]);
  });
});

describe("computeGroupTotals", () => {
  it("returns all-zero/null totals for an empty group, never dividing by zero", () => {
    expect(computeGroupTotals([])).toEqual({
      quantity: 0,
      mrr: 0,
      arr: 0,
      lifetimeContractValue: 0,
      arpu: null,
    });
  });

  it("sums quantity/mrr/arr/lifetimeContractValue across deals; arpu derives from aggregate mrr/quantity, never an average of per-deal ARPU", () => {
    const dealWithQuantity5Mrr500 = deal({
      id: "d1",
      contractTermMonths: 1,
      lineItems: [lineItem({ type: "service", units: 5, unitPrice: 100 })],
    });
    const dealWithQuantity0Mrr0 = deal({
      id: "d2",
      contractTermMonths: 1,
      lineItems: [],
    });

    const totals = computeGroupTotals([dealWithQuantity5Mrr500, dealWithQuantity0Mrr0]);

    expect(totals).toEqual({
      quantity: 5,
      mrr: 500,
      arr: 6000,
      lifetimeContractValue: 500,
      arpu: 100,
    });
  });
});
