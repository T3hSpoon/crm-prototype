import { describe, it, expect } from "vitest";
import { computeQuantity, computeArpu, joinModelSkus, joinServiceNames } from "./deal-metrics";
import type { LineItem } from "@/shared/types/deal";

function lineItem(overrides: Partial<LineItem>): LineItem {
  return {
    id: overrides.id ?? "li-1",
    productOrService: overrides.productOrService ?? "Widget",
    sku: overrides.sku ?? "SKU-1",
    units: overrides.units ?? 1,
    unitPrice: overrides.unitPrice ?? 1,
    type: overrides.type ?? "service",
  };
}

describe("computeQuantity", () => {
  it("sums only service-type line-item units, ignoring product-type units", () => {
    const deal = {
      lineItems: [
        lineItem({ type: "service", units: 5, unitPrice: 10 }),
        lineItem({ type: "product", units: 3, unitPrice: 20 }),
      ],
    };
    expect(computeQuantity(deal)).toBe(5);
  });
});

describe("computeArpu", () => {
  it("returns null (never 0/NaN) when Quantity is 0", () => {
    expect(computeArpu({ lineItems: [] })).toBeNull();
  });
});

describe("joinModelSkus", () => {
  it("comma-joins all line items' skus, filtering out blanks (never a stray/double comma)", () => {
    const deal = {
      lineItems: [
        lineItem({ sku: "ABC" }),
        lineItem({ sku: "" }),
        lineItem({ sku: "DEF" }),
      ],
    };
    expect(joinModelSkus(deal)).toBe("ABC, DEF");
  });
});

describe("joinServiceNames", () => {
  it("comma-joins productOrService of service-type line items only", () => {
    const deal = {
      lineItems: [
        lineItem({ type: "service", productOrService: "Support" }),
        lineItem({ type: "product", productOrService: "Hardware" }),
        lineItem({ type: "service", productOrService: "Training" }),
      ],
    };
    expect(joinServiceNames(deal)).toBe("Support, Training");
  });
});
