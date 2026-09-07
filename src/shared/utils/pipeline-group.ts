import type { Deal, DealOutcome, PipelineGroup, PipelineStage } from "@/shared/types/deal";

/**
 * Derives the UI group a deal currently belongs to. `PipelineGroup` is never
 * stored directly on `Deal` — it is always computed from `pipelineStage` +
 * `outcome` via this function (research/PITFALLS.md Pitfall 3,
 * 01-RESEARCH.md Pattern 2).
 */
export function toPipelineGroup(deal: Deal): PipelineGroup {
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
  return { pipelineStage: group, outcome: "open" };
}
