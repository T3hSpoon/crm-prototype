import { faker } from "@faker-js/faker";
import { addMonths, format, subMonths } from "date-fns";
import type {
  ConfidenceLevel,
  CustomerType,
  Deal,
  DealCurrency,
  DealDocument,
  DealFrequency,
  LineItem,
  LineItemType,
  PipelineStage,
} from "@/shared/types/deal";
import { sumLineItems } from "@/shared/utils/line-items";
import { OWNER_ROSTER, TRAILING_MONTHS } from "@/features/dashboard/dashboard-config";
import { buildQuoteHtml, buildAgreementHtml } from "@/shared/utils/document-templates";

const STAGES: PipelineStage[] = ["prospect", "lead", "opportunity", "deal"];
/** Standard contract-term lengths (seed data only — the live Add Deal form still accepts any value). */
const CONTRACT_TERM_MONTHS = [3, 6, 12, 24, 36, 48, 60] as const;
const FREQUENCIES: DealFrequency[] = ["monthly", "quarterly", "quadrimestral", "semi-annual", "annually"];
const CURRENCIES: DealCurrency[] = ["USD", "EUR", "GBP"];
const CUSTOMER_TYPES: CustomerType[] = ["government", "private-utility", "private-fleet", "similar"];
const CONFIDENCE_LEVELS: ConfidenceLevel[] = ["100", "80", "50", "open-to-rfp"];

/** Total number of fictional deals generated below (D-02, Phase 6). */
export const SEED_DEAL_COUNT = 150;

// Deterministic across runs/CI (Phase 6, D-01/D-02) — makes the generated
// dataset reproducible, which is what makes seed-data.test.ts's "every
// roster owner has >=1 Won deal" assertion a reliable automated fact instead
// of a flaky probabilistic spot-check.
faker.seed(20260917);

/** Realistic per-type unit-price bands — hardware units run $250-350, monthly per-unit service fees run $15-25. */
const PRICE_RANGE: Record<LineItemType, { min: number; max: number }> = {
  product: { min: 250, max: 350 },
  service: { min: 15, max: 25 },
};

function buildSeedLineItem(type: LineItemType): LineItem {
  return {
    // Never a sequential counter or array index (research/PITFALLS.md
    // Pitfall 1/5) — same id convention as Deal.id.
    id: faker.string.uuid(),
    productOrService: faker.commerce.productName(),
    sku: faker.string.alphanumeric(8).toUpperCase(),
    units: faker.number.int({ min: 1, max: 20 }),
    unitPrice: faker.number.int(PRICE_RANGE[type]),
    type,
  };
}

function buildSeedDeal(): Deal {
  const pipelineStage = faker.helpers.arrayElement(STAGES);
  // ~15% of seed deals are marked lost; a further ~15% of the remainder are
  // pre-seeded as won (Phase 3.1, WON-01) so the Contracts group is demoable
  // on first load without requiring a manual Won transition first.
  const isLost = faker.datatype.boolean({ probability: 0.15 });
  const isWon = !isLost && faker.datatype.boolean({ probability: 0.15 });
  const contractTermMonths = faker.helpers.arrayElement(CONTRACT_TERM_MONTHS);

  // Every deal (DEAL-04/DEAL-05 seed data) gets one `product` "units" line
  // item priced $250-350 (hardware) and at least one `service` line item
  // priced $15-25/mo (per-unit service fee) — a realistic hardware+service
  // bundle. The deal's value is set to the computed sum so seeded deals
  // start in the auto-tracked (non-overridden) state.
  //
  // Won deals get 2 distinct `service` line items (different SKU/unitPrice
  // each, both still in the $15-25 band) instead of 1 — a real contract
  // commonly bundles more than one billed service (e.g. one unit type at
  // $X/mo, another at $Y/mo), and DASH-03's owner-level ARPU is a
  // quantity-weighted average across exactly this kind of mixed-rate
  // line-item set. Without 2+ services, ARPU still computes correctly for
  // any deal that happens to have them, but nothing in the seed data
  // reliably demonstrated the blending.
  const lineItems: LineItem[] = isWon
    ? [
        buildSeedLineItem("product"),
        buildSeedLineItem("service"),
        buildSeedLineItem("service"),
      ]
    : [buildSeedLineItem("product"), buildSeedLineItem("service")];

  return {
    id: faker.string.numeric(10),
    name: faker.company.buzzPhrase(),
    company: faker.company.name(),
    value:
      lineItems.length > 0
        ? sumLineItems(lineItems)
        : faker.number.int({ min: 5_000, max: 250_000 }),
    owner: faker.helpers.arrayElement(OWNER_ROSTER),
    // D-05/D-06: closeDate's meaning is outcome-dependent. For still-open
    // deals it remains the forward-looking "expected close" date (unchanged,
    // 0-90 days ahead). For lost deals it's backdated across the trailing 12
    // months to represent "when it actually closed" (lost). Won deals also
    // get an independent trailing-12-month closeDate here so they never show
    // a future date elsewhere in Pipeline/Forecast, even though DASH-01/02
    // read `contractSignedDate` instead (D-04) for their own "closed" date.
    closeDate: isLost
      ? faker.date.between({ from: subMonths(new Date(), TRAILING_MONTHS), to: new Date() }).toISOString()
      : isWon
        ? faker.date.between({ from: subMonths(new Date(), TRAILING_MONTHS), to: new Date() }).toISOString()
        : faker.date.soon({ days: 90 }).toISOString(),
    pipelineStage,
    outcome: isLost ? "lost" : isWon ? "won" : "open",
    createdAt: faker.date.recent({ days: 60 }).toISOString(),
    lineItems,
    // Every seeded deal starts with no documents — Generate Quote/Agreement/
    // Upload PDF add to this array only via user interaction (quick task
    // 260918-fis); no generator ever writes into it.
    documents: [],
    prorata: faker.datatype.boolean(),
    gracePeriodDays: faker.number.int({ min: 0, max: 90 }),
    contractTermMonths,
    frequency: faker.helpers.arrayElement(FREQUENCIES),
    currency: faker.helpers.arrayElement(CURRENCIES),
    contractStartDate: isWon ? faker.date.recent({ days: 60 }).toISOString().slice(0, 10) : undefined,
    // D-06: trailing-12-month spread (was faker.date.recent({ days: 90 })) —
    // gives DASH-01/DASH-02's "closed" date (D-04) enough historical range to
    // populate a 12-month trend.
    contractSignedDate: isWon
      ? faker.date.between({ from: subMonths(new Date(), TRAILING_MONTHS), to: new Date() }).toISOString().slice(0, 10)
      : undefined,
    contractEndDate: isWon
      ? format(addMonths(new Date(), contractTermMonths), "yyyy-MM-dd")
      : undefined,
    paymentTerms: isWon
      ? faker.helpers.arrayElement([
          "Net 30, billed monthly",
          "Net 60, billed quarterly",
          "Due on receipt, billed monthly",
          "Net 45, billed annually",
        ])
      : undefined,
    // Customer Type / Confidence Level (Quick task 260910-ec8). MRR/ARR/
    // Lifetime Contract Value/ARPU are not generated here — they are
    // derived at read time by deal-metrics.ts (Quick task 260910-fl6).
    customerType: faker.helpers.arrayElement(CUSTOMER_TYPES),
    confidenceLevel: faker.helpers.arrayElement(CONFIDENCE_LEVELS),
  };
}

/**
 * SEED_DEAL_COUNT (150, D-02, Phase 6) fictional deals distributed across
 * the 4 pipelineStage values, ~15% marked lost and a further ~15% of the
 * remainder marked won (with all 4 contract-term fields populated, Phase 3.1
 * WON-01) so the Contracts group is demoable on first load. Deal `id` is a
 * `faker.string.numeric(10)` 10-digit numeric string; LineItem `id` remains
 * a `faker.string.uuid()` — neither is ever a sequential counter or array
 * index (research/PITFALLS.md Pitfall 1/5). Every field is generated by
 * faker's fictional generators — never real prospect/company/person data,
 * even for internal demos. `owner` is drawn from the fixed 5-name
 * `OWNER_ROSTER` (D-01), and generation is deterministic via
 * `faker.seed(20260917)` above, so every roster owner is guaranteed to have
 * at least one Won deal (verified by `seed-data.test.ts`).
 */
const generatedSeedDeals: Deal[] =
  typeof faker.helpers.multiple === "function"
    ? faker.helpers.multiple(buildSeedDeal, { count: SEED_DEAL_COUNT })
    : Array.from({ length: SEED_DEAL_COUNT }, buildSeedDeal);

/**
 * Builds a `DealDocument` exactly the way `pipelineStore.generateDocument`
 * does at runtime (Blob + `URL.createObjectURL`, never a PDF library, D-03
 * locked) — so a couple of seed deals demo the Documents column populated
 * on first load instead of every deal starting at the empty "No assets"
 * state. `URL.createObjectURL` is a real Web API, available in both the
 * browser and this project's Node-based Vitest environment.
 */
function buildSeedDocument(deal: Deal, kind: "quote" | "agreement"): DealDocument {
  const html = kind === "quote" ? buildQuoteHtml(deal) : buildAgreementHtml(deal);
  const blob = new Blob([html], { type: "text/html" });
  return {
    id: crypto.randomUUID(),
    fileName: `${kind === "quote" ? "Quote" : "Agreement"} - ${deal.company}.html`,
    format: "HTML",
    url: URL.createObjectURL(blob),
    createdAt: deal.contractSignedDate ?? deal.createdAt,
  };
}

// Pre-populate a couple of Won deals with real generated documents (D-04)
// so the Pipeline's Documents column isn't uniformly empty on first load —
// the first 2 Won deals in generation order get a Quote, and the first of
// those also gets an Agreement, demonstrating both document kinds and the
// multi-document case in the same seed set. Starts scanning from index 5:
// `pipelineStore.test.ts` loads the real seedDeals and asserts `deals[0..4]`
// specifically start with an empty documents array — skipping those indices
// keeps that test's fixture assumptions true without coupling this file to
// a hardcoded test index.
const wonDealIndices = generatedSeedDeals
  .map((d, i) => (d.outcome === "won" ? i : -1))
  .filter((i) => i >= 5)
  .slice(0, 2);

for (const [n, i] of wonDealIndices.entries()) {
  const deal = generatedSeedDeals[i];
  const docs = [buildSeedDocument(deal, "quote")];
  if (n === 0) docs.push(buildSeedDocument(deal, "agreement"));
  generatedSeedDeals[i] = { ...deal, documents: docs };
}

export const seedDeals: Deal[] = generatedSeedDeals;
