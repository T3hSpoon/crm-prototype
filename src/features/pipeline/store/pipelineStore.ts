import { create } from "zustand";
import { dealsRepository } from "@/data";
import type { Deal, DealDocument, NewDealInput, PipelineGroup } from "@/shared/types/deal";
import { clearPatchFor, fromPipelineGroup } from "@/shared/utils/pipeline-group";
import type { LostReasonFormValues } from "@/features/pipeline/components/lost-reason-schema";
import type { WonContractTermsFormValues } from "@/features/pipeline/components/won-contract-terms-schema";
import { buildAgreementHtml, buildQuoteHtml } from "@/shared/utils/document-templates";

interface PipelineState {
  deals: Deal[];
  status: "idle" | "loading" | "ready";
  load: () => Promise<void>;
  addDeal: (input: NewDealInput) => Promise<void>;
  moveStage: (dealId: string, group: PipelineGroup) => Promise<void>;
  moveToLost: (
    dealId: string,
    category: LostReasonFormValues["category"],
    note?: string,
  ) => Promise<void>;
  moveToWon: (dealId: string, terms: WonContractTermsFormValues) => Promise<void>;
  updateDeal: (
    id: string,
    patch: Partial<
      Pick<Deal, "name" | "value" | "owner" | "closeDate" | "lineItems" | "confidenceLevel">
    >,
  ) => Promise<void>;
  generateDocument: (dealId: string, kind: "quote" | "agreement") => Promise<void>;
  uploadDocument: (dealId: string, file: File) => Promise<void>;
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
    const patch = { ...fromPipelineGroup(group, current?.pipelineStage), ...clearPatchFor(group) };
    const updated = await dealsRepository.update(dealId, patch);
    // Replace by id, never by array index (research/PITFALLS.md Pitfall 5).
    set({ deals: get().deals.map((d) => (d.id === dealId ? updated : d)) });
  },

  moveToLost: async (dealId, category, note) => {
    try {
      const current = get().deals.find((d) => d.id === dealId);
      const patch = {
        ...fromPipelineGroup("lost", current?.pipelineStage),
        lostReason: note ? `${category}: ${note}` : category,
        ...clearPatchFor("lost"),
      };
      const updated = await dealsRepository.update(dealId, patch);
      // Replace by id, never by array index (research/PITFALLS.md Pitfall 5).
      set({ deals: get().deals.map((d) => (d.id === dealId ? updated : d)) });
    } catch (err) {
      // Mirrors updateDeal's log+rethrow pattern — LostReasonDialog's catch
      // block shows the inline error copy and keeps the dialog open with
      // the user's selections intact (Task 2, UI-SPEC error-state contract).
      console.error("moveToLost failed", err);
      throw err;
    }
  },

  moveToWon: async (dealId, terms) => {
    try {
      const current = get().deals.find((d) => d.id === dealId);
      const patch = {
        ...fromPipelineGroup("won", current?.pipelineStage),
        ...terms,
        ...clearPatchFor("won"),
      };
      const updated = await dealsRepository.update(dealId, patch);
      // Replace by id, never by array index (research/PITFALLS.md Pitfall 5).
      set({ deals: get().deals.map((d) => (d.id === dealId ? updated : d)) });
    } catch (err) {
      // Mirrors updateDeal's log+rethrow pattern — WonContractTermsDialog's
      // catch block shows the inline error copy and keeps the dialog open
      // with the user's entered values intact (Task 2, UI-SPEC error-state
      // contract).
      console.error("moveToWon failed", err);
      throw err;
    }
  },

  updateDeal: async (id, patch) => {
    try {
      const updated = await dealsRepository.update(id, patch);
      // Replace by id, never by array index (research/PITFALLS.md Pitfall 5).
      set({ deals: get().deals.map((d) => (d.id === id ? updated : d)) });
    } catch (err) {
      // Carried-forward fix for 01-REVIEW.md WR-01: log and re-throw so the
      // calling UI component's own catch can revert local state and show its
      // error banner — never swallow the rejection silently.
      console.error("updateDeal failed", err);
      throw err;
    }
  },

  generateDocument: async (dealId, kind) => {
    try {
      const current = get().deals.find((d) => d.id === dealId);
      if (!current) {
        throw new Error(`Deal with id "${dealId}" not found`);
      }
      const html = kind === "quote" ? buildQuoteHtml(current) : buildAgreementHtml(current);
      // D-03 (locked): a Blob + object URL — never a PDF-generation library.
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const doc: DealDocument = {
        id: crypto.randomUUID(),
        fileName: `${kind === "quote" ? "Quote" : "Agreement"} - ${current.company}.html`,
        format: "HTML",
        url,
        createdAt: new Date().toISOString(),
      };
      const updated = await dealsRepository.update(dealId, {
        documents: [...current.documents, doc],
      });
      // Replace by id, never by array index (research/PITFALLS.md Pitfall 5).
      set({ deals: get().deals.map((d) => (d.id === dealId ? updated : d)) });
    } catch (err) {
      // Mirrors updateDeal's log+rethrow pattern.
      console.error("generateDocument failed", err);
      throw err;
    }
  },

  uploadDocument: async (dealId, file) => {
    try {
      // Store-level enforcement of the file input's accept="application/pdf"
      // restriction (mitigates T-fis-02) — the accept attribute alone
      // doesn't block an OS "All files" picker selection. Checked BEFORE
      // touching the repository.
      if (file.type !== "application/pdf") {
        throw new Error("Only PDF files can be uploaded.");
      }
      const current = get().deals.find((d) => d.id === dealId);
      if (!current) {
        throw new Error(`Deal with id "${dealId}" not found`);
      }
      // The File already IS the real PDF — no Blob wrapping needed.
      const url = URL.createObjectURL(file);
      const doc: DealDocument = {
        id: crypto.randomUUID(),
        fileName: file.name,
        format: "PDF",
        url,
        createdAt: new Date().toISOString(),
      };
      const updated = await dealsRepository.update(dealId, {
        documents: [...current.documents, doc],
      });
      // Replace by id, never by array index (research/PITFALLS.md Pitfall 5).
      set({ deals: get().deals.map((d) => (d.id === dealId ? updated : d)) });
    } catch (err) {
      // Mirrors updateDeal's log+rethrow pattern.
      console.error("uploadDocument failed", err);
      throw err;
    }
  },
}));
