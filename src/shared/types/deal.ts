// Deal data model — see research/PITFALLS.md Pitfall 3 and
// .planning/phases/01-pipeline-board-foundation/01-RESEARCH.md Pattern 2.
//
// `pipelineStage` (funnel position) and `outcome` (open/won/lost) are modeled
// as two separate fields. The 5 UI groups (Prospect, Lead, Opportunity,
// Deal/Won, Lost) are always DERIVED from this pair via `toPipelineGroup` in
// `shared/utils/pipeline-group.ts` — never stored directly on Deal. This lets
// a lost deal retain the pipelineStage it was lost from, which a flat `stage`
// field would destroy the moment it's overwritten with "lost".

/** Funnel position — matches PROJECT.md's locked pipeline order. */
export type PipelineStage = "prospect" | "lead" | "opportunity" | "deal";

/** Terminal/open state, independent of funnel position. */
export type DealOutcome = "open" | "won" | "lost";

/**
 * The 5 UI groups the pipeline board renders. Always derived from
 * `pipelineStage` + `outcome` via `toPipelineGroup` — never stored directly.
 */
export type PipelineGroup = "prospect" | "lead" | "opportunity" | "deal" | "lost";

/** Whether a deal's line item is a product or a service. */
export type LineItemType = "product" | "service";

/** Billing cadence for a deal's contract terms (Phase 3, DEAL-06). */
export type DealFrequency = "monthly" | "quarterly" | "quadrimestral" | "semi-annual" | "annually";

/** Contract currency for a deal's deal-terms fields (Phase 3, DEAL-06). */
export type DealCurrency = "USD" | "EUR" | "GBP";

/** Customer classification captured via the Add Deal wizard's step 2 (Quick task 260910-ec8). */
export type CustomerType = "government" | "private-utility" | "private-fleet" | "similar";

/**
 * Forecast-confidence classification captured via the Add Deal wizard's step
 * 2 (Quick task 260910-ec8). `"open-to-rfp"` is a non-numeric sentinel —
 * distinct from the three percentage values, never coerced to a number.
 */
export type ConfidenceLevel = "100" | "80" | "50" | "open-to-rfp";

/**
 * A single product/service line item on a Deal (Phase 2, DEAL-04). A
 * subtotal is intentionally NOT a field here — always derived from
 * `units * unitPrice` via `computeSubtotal` in `shared/utils/line-items.ts`,
 * mirroring the `PipelineGroup` "never stored directly" convention above.
 */
export interface LineItem {
  id: string;
  productOrService: string;
  sku: string;
  units: number;
  unitPrice: number;
  type: LineItemType;
}

export interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  owner: string;
  /** ISO 8601 */
  closeDate: string;
  pipelineStage: PipelineStage;
  outcome: DealOutcome;
  /** Unused in Phase 1 UI; field exists so Phase 3's lost-reason gate needs no migration. */
  lostReason?: string;
  /** ISO 8601 */
  createdAt: string;
  /** Product/service composition (Phase 2, DEAL-04). Starts empty at creation. */
  lineItems: LineItem[];
  /** Deal-terms fields captured via the Add Deal wizard's step 2 (Phase 3, DEAL-06). */
  prorata: boolean;
  gracePeriodDays: number;
  contractTermMonths: number;
  frequency: DealFrequency;
  currency: DealCurrency;
  /**
   * Customer Type / Confidence Level captured via the Add Deal wizard's
   * step 2 (Quick task 260910-ec8). MRR/ARR/Lifetime Contract Value/ARPU are
   * intentionally not fields here — they are derived on demand by
   * `src/shared/utils/deal-metrics.ts` (Quick task 260910-fl6) from `value`/
   * `frequency`/`contractTermMonths`/`lineItems`, so they can never go stale
   * relative to those fields.
   */
  customerType: CustomerType;
  confidenceLevel: ConfidenceLevel;
}

/**
 * Shape the add-deal form submits (D-01: full intake, 5 required fields;
 * D-02: a stage selector picking which of the 5 UI groups the new deal
 * starts in, rather than always defaulting to Prospect).
 */
export interface NewDealInput {
  name: string;
  company: string;
  value: number;
  owner: string;
  closeDate: string;
  group: PipelineGroup;
  /** Deal-terms fields captured via the Add Deal wizard's step 2 (Phase 3, DEAL-06). */
  prorata: boolean;
  gracePeriodDays: number;
  contractTermMonths: number;
  frequency: DealFrequency;
  currency: DealCurrency;
  /**
   * Customer Type / Confidence Level captured via the Add Deal wizard's
   * step 2 (Quick task 260910-ec8). MRR/ARR/Lifetime Contract Value/ARPU are
   * intentionally not fields here — they are derived on demand by
   * `src/shared/utils/deal-metrics.ts` (Quick task 260910-fl6) from `value`/
   * `frequency`/`contractTermMonths`/`lineItems`, so they can never go stale
   * relative to those fields.
   */
  customerType: CustomerType;
  confidenceLevel: ConfidenceLevel;
}
