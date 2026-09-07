import { create } from "zustand";
import { dealsRepository } from "@/data";
import type { Deal, NewDealInput, PipelineGroup } from "@/shared/types/deal";
import { fromPipelineGroup } from "@/shared/utils/pipeline-group";

interface PipelineState {
  deals: Deal[];
  status: "idle" | "loading" | "ready";
  load: () => Promise<void>;
  addDeal: (input: NewDealInput) => Promise<void>;
  moveStage: (dealId: string, group: PipelineGroup) => Promise<void>;
}

/**
 * Zustand store for the pipeline board. Actions call `dealsRepository`
 * (imported only from `@/data`, never `mock-deals-repository.ts` directly)
 * and update local state — components read/act through this store, never
 * the repository directly (research/ARCHITECTURE.md Zustand store pattern).
 */
export const usePipelineStore = create<PipelineState>()((set, get) => ({
  deals: [],
  status: "idle",

  load: async () => {
    set({ status: "loading" });
    const deals = await dealsRepository.list();
    set({ deals, status: "ready" });
  },

  addDeal: async (input) => {
    const created = await dealsRepository.create(input);
    set({ deals: [...get().deals, created] });
  },

  moveStage: async (dealId, group) => {
    const current = get().deals.find((d) => d.id === dealId);
    const patch = fromPipelineGroup(group, current?.pipelineStage);
    const updated = await dealsRepository.update(dealId, patch);
    // Replace by id, never by array index (research/PITFALLS.md Pitfall 5).
    set({ deals: get().deals.map((d) => (d.id === dealId ? updated : d)) });
  },
}));
