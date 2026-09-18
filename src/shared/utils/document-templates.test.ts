import { describe, it, expect } from "vitest";
import { buildQuoteHtml, buildAgreementHtml } from "./document-templates";
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
    documents: overrides.documents ?? [],
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

describe("buildQuoteHtml", () => {
  it("includes the deal's company, name, owner, expected close date, and formatted value", () => {
    const d = deal({
      company: "Acme Corp",
      name: "Acme Rollout",
      owner: "Jane Owner",
      closeDate: "2026-03-15T00:00:00.000Z",
      value: 12500,
      lineItems: [],
    });

    const html = buildQuoteHtml(d);

    expect(html).toContain("Acme Corp");
    expect(html).toContain("Acme Rollout");
    expect(html).toContain("Jane Owner");
    expect(html).toContain("2026-03-15");
    expect(html).toContain("$12,500");
  });

  it("includes each line item's name/units/unit price/subtotal when lineItems is non-empty", () => {
    const d = deal({
      lineItems: [
        lineItem({
          productOrService: "Widget",
          sku: "WID-1",
          type: "product",
          units: 3,
          unitPrice: 100,
        }),
      ],
    });

    const html = buildQuoteHtml(d);

    expect(html).toContain("Widget");
    expect(html).toContain("3");
    expect(html).toContain("$100");
    expect(html).toContain("$300");
  });

  it("HTML-escapes every deal-derived free-text field, including a script-bearing company/line-item name", () => {
    const d = deal({
      company: '<script>alert("xss")</script>',
      lineItems: [
        lineItem({
          productOrService: '<script>alert("li")</script>',
          sku: "SKU-<b>",
        }),
      ],
    });

    const html = buildQuoteHtml(d);

    expect(html).not.toContain("<script>alert(\"xss\")</script>");
    expect(html).not.toContain("<script>alert(\"li\")</script>");
    expect(html).toContain("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
    expect(html).toContain("&lt;script&gt;alert(&quot;li&quot;)&lt;/script&gt;");
  });
});

describe("buildAgreementHtml", () => {
  it("includes the same company/deal info block and conditional line-items table as buildQuoteHtml", () => {
    const d = deal({
      company: "Acme Corp",
      name: "Acme Rollout",
      owner: "Jane Owner",
      lineItems: [lineItem({ productOrService: "Widget", sku: "WID-1" })],
    });

    const html = buildAgreementHtml(d);

    expect(html).toContain("Acme Corp");
    expect(html).toContain("Acme Rollout");
    expect(html).toContain("Jane Owner");
    expect(html).toContain("Widget");
  });

  it("includes contractTermMonths, frequency, currency, prorata (Yes/No), gracePeriodDays, and the computed Lifetime Contract Value", () => {
    const d = deal({
      contractTermMonths: 12,
      frequency: "monthly",
      currency: "USD",
      prorata: true,
      gracePeriodDays: 30,
      lineItems: [lineItem({ type: "service", units: 10, unitPrice: 100 })],
    });

    const html = buildAgreementHtml(d);

    expect(html).toContain("12");
    expect(html).toContain("monthly");
    expect(html).toContain("USD");
    expect(html).toContain("Yes");
    expect(html).toContain("30");
    // MRR = 10 * 100 = 1000; LTV = 0 (no product line items) + 1000 * 12 = 12000
    expect(html).toContain("$12,000");
  });

  it("renders prorata as No when the deal's prorata field is false", () => {
    const d = deal({ prorata: false });
    const html = buildAgreementHtml(d);
    expect(html).toContain("No");
  });
});
