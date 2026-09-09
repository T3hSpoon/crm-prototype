import type { DealsRepository } from "@/data/deals-repository";
import type { Deal, NewDealInput } from "@/shared/types/deal";
import { fromPipelineGroup } from "@/shared/utils/pipeline-group";
import { seedDeals } from "@/data/mock/seed-data";

// Replaces the previous Web Crypto UUID-based id assignment in create() —
// generates a 10-digit numeric string id, matching the format used by
// seed-data.ts's buildSeedDeal().
function generateDealId(): string {
  let id = "";
  for (let i = 0; i < 10; i++) {
    id += Math.floor(Math.random() * 10);
  }
  return id;
}

/**
 * In-memory implementation of DealsRepository, seeded from seed-data.ts.
 * Stands in for a future real API/DB implementation — every method resolves
 * a Promise so call sites (the Zustand store) don't change shape when this
 * is swapped for a real network-backed implementation later.
 *
 * Only src/data/index.ts may import this file directly — no component or
 * store file should reach past the DealsRepository interface.
 */
export class MockDealsRepository implements DealsRepository {
  private deals: Deal[];

  constructor(initialDeals: Deal[] = seedDeals) {
    this.deals = [...initialDeals];
  }

  list(): Promise<Deal[]> {
    return Promise.resolve([...this.deals]);
  }

  create(input: NewDealInput): Promise<Deal> {
    const { pipelineStage, outcome } = fromPipelineGroup(input.group);
    const deal: Deal = {
      id: generateDealId(),
      name: input.name,
      company: input.company,
      value: input.value,
      owner: input.owner,
      closeDate: input.closeDate,
      pipelineStage,
      outcome,
      createdAt: new Date().toISOString(),
      // New deals start with no line items — DEAL-04's line-items UI (plan
      // 02-02) adds them after creation, not via the Add Deal form.
      lineItems: [],
      // Deal-terms fields, captured via the Add Deal wizard's step 2
      // (Phase 3, DEAL-06) — direct pass-through, no transform.
      prorata: input.prorata,
      gracePeriodDays: input.gracePeriodDays,
      contractTermMonths: input.contractTermMonths,
      frequency: input.frequency,
      currency: input.currency,
    };
    this.deals.push(deal);
    return Promise.resolve(deal);
  }

  update(
    id: string,
    patch: Partial<
      Pick<
        Deal,
        "pipelineStage" | "outcome" | "lostReason" | "name" | "value" | "owner" | "closeDate" | "lineItems"
      >
    >,
  ): Promise<Deal> {
    // Find by stable id, never by array index (research/PITFALLS.md Pitfall 5)
    // — array index breaks the moment deals are grouped/filtered/reordered.
    const index = this.deals.findIndex((d) => d.id === id);
    if (index === -1) {
      return Promise.reject(new Error(`Deal with id "${id}" not found`));
    }
    const updated: Deal = { ...this.deals[index], ...patch };
    this.deals[index] = updated;
    return Promise.resolve(updated);
  }
}
