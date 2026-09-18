import { beforeAll, describe, it, expect } from "vitest";
import { usePipelineStore } from "./pipelineStore";

/**
 * Covers the `generateDocument`/`uploadDocument` behavior bullets from
 * 260918-fis-PLAN.md Task 1. `load()` runs once in `beforeAll` to populate
 * `deals` from the real `dealsRepository` (matching this store's existing
 * pattern of never mocking the repository seam) — every assertion below
 * exercises real deal ids from that array.
 */
describe("pipelineStore document actions", () => {
  beforeAll(async () => {
    await usePipelineStore.getState().load();
  });

  it("a freshly loaded deal's documents array starts empty", () => {
    const deals = usePipelineStore.getState().deals;
    expect(deals.length).toBeGreaterThan(0);
    for (const deal of deals) {
      expect(deal.documents).toEqual([]);
    }
  });

  it("generateDocument(dealId, 'quote') appends exactly one HTML DealDocument with a blob: url, leaving other deals untouched", async () => {
    const deals = usePipelineStore.getState().deals;
    const target = deals[0];
    const untouchedId = deals[1].id;

    await usePipelineStore.getState().generateDocument(target.id, "quote");

    const updated = usePipelineStore.getState().deals.find((d) => d.id === target.id);
    expect(updated?.documents).toHaveLength(1);
    expect(updated?.documents[0].format).toBe("HTML");
    expect(updated?.documents[0].url.startsWith("blob:")).toBe(true);

    const untouched = usePipelineStore.getState().deals.find((d) => d.id === untouchedId);
    expect(untouched?.documents).toEqual([]);
  });

  it("generateDocument(dealId, 'agreement') after 'quote' on the same deal results in 2 documents (never overwrites)", async () => {
    const deals = usePipelineStore.getState().deals;
    const target = deals[2];

    await usePipelineStore.getState().generateDocument(target.id, "quote");
    await usePipelineStore.getState().generateDocument(target.id, "agreement");

    const updated = usePipelineStore.getState().deals.find((d) => d.id === target.id);
    expect(updated?.documents).toHaveLength(2);
    expect(updated?.documents.map((doc) => doc.format)).toEqual(["HTML", "HTML"]);
  });

  it("uploadDocument(dealId, file) with an application/pdf File appends a PDF DealDocument with a matching fileName and a blob: url", async () => {
    const deals = usePipelineStore.getState().deals;
    const target = deals[3];
    const file = new File(["%PDF-1.4"], "contract.pdf", { type: "application/pdf" });

    await usePipelineStore.getState().uploadDocument(target.id, file);

    const updated = usePipelineStore.getState().deals.find((d) => d.id === target.id);
    expect(updated?.documents).toHaveLength(1);
    expect(updated?.documents[0].format).toBe("PDF");
    expect(updated?.documents[0].fileName).toBe("contract.pdf");
    expect(updated?.documents[0].url.startsWith("blob:")).toBe(true);
  });

  it("uploadDocument(dealId, file) with a non-application/pdf File rejects and leaves that deal's documents array unchanged", async () => {
    const deals = usePipelineStore.getState().deals;
    const target = deals[4];
    const file = new File(["not a pdf"], "notes.txt", { type: "text/plain" });

    await expect(usePipelineStore.getState().uploadDocument(target.id, file)).rejects.toThrow();

    const updated = usePipelineStore.getState().deals.find((d) => d.id === target.id);
    expect(updated?.documents).toEqual([]);
  });
});
