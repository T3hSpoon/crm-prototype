import type { Deal, NewDealInput } from "@/shared/types/deal";

/**
 * The data-access seam (research/ARCHITECTURE.md repository pattern). This
 * interface represents the future API boundary today as a same-process
 * TypeScript contract — the only implementation this phase provides is
 * `MockDealsRepository` (in-memory), but any component/store code should be
 * written against this interface so swapping in a real API implementation
 * later touches only `src/data/`, not call sites.
 */
export interface DealsRepository {
  list(): Promise<Deal[]>;
  create(input: NewDealInput): Promise<Deal>;
  update(
    id: string,
    patch: Partial<Pick<Deal, "pipelineStage" | "outcome" | "lostReason">>,
  ): Promise<Deal>;
}
