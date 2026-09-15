import type { Deal, DealOutcome, PipelineGroup, PipelineStage } from "@/shared/types/deal";

/**
 * Derives the UI group a deal currently belongs to. `PipelineGroup` is never
 * stored directly on `Deal` — it is always computed from `pipelineStage` +
 * `outcome` via this function (research/PITFALLS.md Pitfall 3,
 * 01-RESEARCH.md Pattern 2).
 */
export function toPipelineGroup(deal: Deal): PipelineGroup {
  if (deal.outcome === "won") return "won";
  return deal.outcome === "lost" ? "lost" : deal.pipelineStage;
}

/**
 * The reverse mapping: given a UI group the user picked (add-deal form's
 * stage selector, or the stage-move control), computes the `pipelineStage`
 * and `outcome` to store.
 *
 * When moving into "lost", the prior `pipelineStage` is preserved so a lost
 * deal remembers what stage it fell through from (Pitfall 3). If there is no
 * prior stage — a brand-new deal added directly into Lost — defaults to
 * "prospect" (01-RESEARCH.md Assumption A2).
 */
export function fromPipelineGroup(
  group: PipelineGroup,
  previousStage?: PipelineStage,
): { pipelineStage: PipelineStage; outcome: DealOutcome } {
  if (group === "lost") {
    return { pipelineStage: previousStage ?? "prospect", outcome: "lost" };
  }
  if (group === "won") {
    return { pipelineStage: previousStage ?? "deal", outcome: "won" };
  }
  return { pipelineStage: group, outcome: "open" };
}

/**
 * Computes the opposing-terminal-state fields to clear when a deal
 * transitions into `group`. A deal moving anywhere other than "lost" has its
 * `lostReason` cleared; a deal moving anywhere other than "won" has all 4
 * contract-term fields cleared. Centralized here and spread into the patch
 * object by `moveStage`/`moveToLost`/`moveToWon` alike so all 3 call sites
 * can never drift out of sync (03.1-REVIEW.md CR-01, D-12/D-13).
 */
export function clearPatchFor(group: PipelineGroup): Partial<Deal> {
  const patch: Partial<Deal> = {};
  if (group !== "lost") patch.lostReason = undefined;
  if (group !== "won") {
    patch.contractStartDate = undefined;
    patch.contractEndDate = undefined;
    patch.contractSignedDate = undefined;
    patch.paymentTerms = undefined;
  }
  return patch;
}
