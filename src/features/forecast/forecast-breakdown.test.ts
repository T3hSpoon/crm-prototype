import { describe, it, expect } from "vitest";
import { groupDealsByConfidence } from "./forecast-breakdown";
import type { Deal } from "@/shared/types/deal";

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
