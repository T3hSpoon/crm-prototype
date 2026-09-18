import type { Deal } from "@/shared/types/deal";
import { computeSubtotal, sumLineItems } from "@/shared/utils/line-items";
import { computeLifetimeContractValue } from "@/shared/utils/deal-metrics";

/**
 * Pure HTML document builders for a deal's Quote/Agreement documents (quick
 * task 260918-fis, restyled per a real Idrive Inc quote reference). Mirrors
 * `deal-metrics.ts`/`line-items.ts`'s pure-function module shape — no side
 * effects, no store/repository imports. D-03 (locked): these produce a
 * static HTML string, never a real PDF — the caller
 * (`pipelineStore.generateDocument`) wraps the result in a `Blob` + object
 * URL, never a PDF-generation library.
 */

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

/**
 * Escapes the 5 characters that matter for safe HTML text/attribute
 * interpolation. Every deal-derived free-text field (company, deal name,
 * owner, line-item productOrService/sku — all user-editable via
 * EditableCell/LineItemsTable) MUST be passed through this before
 * interpolation, since the generated HTML is opened directly in a browser
 * tab (mitigates T-fis-01).
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Deterministic 10-digit document id, same shape as Deal.id, derived from the deal id + kind (never a counter/array index). */
function buildDocumentId(dealId: string, kind: string): string {
  let hash = 0;
  const seed = `${dealId}-${kind}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return String(hash).padStart(10, "0").slice(0, 10);
}

const BRAND_MAROON = "#7a1a2e";

const DOCUMENT_STYLE = `
  body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; padding: 2.5rem; max-width: 760px; margin: 0 auto; }
  .sender { margin-bottom: 2rem; }
  .sender .brand { font-size: 1.5rem; font-weight: 700; color: ${BRAND_MAROON}; margin: 0; }
  .sender p { margin: 0.15rem 0; font-size: 0.85rem; }
  h1 { text-align: center; font-size: 1.75rem; margin: 1.5rem 0; }
  .bar { display: flex; align-items: center; justify-content: space-between; background: ${BRAND_MAROON}; color: #fff; padding: 0.5rem 1rem; font-weight: 700; border-radius: 4px; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.3rem 1rem; margin: 1.25rem 0 2rem; }
  dt { font-weight: 700; }
  dd { margin: 0; }
  h2 { text-align: center; font-size: 1.15rem; margin: 2rem 0 0.75rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
  th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #ddd; }
  th { background: ${BRAND_MAROON}; color: #fff; font-weight: 700; }
  tr.total td { font-weight: 700; border-top: 2px solid #333; border-bottom: none; }
  .signatures { margin-top: 2.5rem; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #999; margin-top: 0.75rem; }
  .sig-cell { padding: 1.5rem 1rem 0.75rem; text-align: center; border-right: 1px solid #999; }
  .sig-cell:last-child { border-right: none; }
  .sig-line { margin-top: 2rem; border-top: 1px solid #333; padding-top: 0.25rem; }
  .note { margin-top: 1.5rem; font-size: 0.85rem; color: #333; }
`;

function senderHeaderHtml(): string {
  return `
    <div class="sender">
      <p class="brand">Idrive Inc</p>
      <p>249 N. Turnpike Rd. Santa Barbara, CA 93111</p>
    </div>`;
}

function detailsBarHtml(label: string, documentId: string): string {
  return `<div class="bar"><span>${escapeHtml(label)}</span><span>ID: ${escapeHtml(documentId)}</span></div>`;
}

/**
 * `closeDate` is only ever supplied by `buildQuoteHtml` — `buildAgreementHtml`
 * doesn't accept it in its `Pick<Deal, ...>` signature (the 5 contract-term
 * fields it adds cover the Agreement's own date-shaped info), so this block
 * omits the "Expected Close Date" row entirely when it's not provided.
 */
function dealInfoBlockHtml(
  deal: Pick<Deal, "name" | "company" | "value" | "owner"> & { closeDate?: string },
): string {
  const closeDateRow = deal.closeDate
    ? `
      <dt>Expected Close Date</dt>
      <dd>${escapeHtml(deal.closeDate.slice(0, 10))}</dd>`
    : "";
  return `
    <dl>
      <dt>Company</dt>
      <dd>${escapeHtml(deal.company)}</dd>
      <dt>Deal</dt>
      <dd>${escapeHtml(deal.name)}</dd>
      <dt>Account Owner</dt>
      <dd>${escapeHtml(deal.owner)}</dd>${closeDateRow}
      <dt>Value</dt>
      <dd>${currencyFormatter.format(deal.value)}</dd>
    </dl>`;
}

function lineItemsTableHtml(deal: Pick<Deal, "lineItems">): string {
  if (deal.lineItems.length === 0) {
    return "<p>No line items.</p>";
  }
  const rows = deal.lineItems
    .map((item) => {
      const subtotal = computeSubtotal(item);
      return `
        <tr>
          <td>${escapeHtml(item.productOrService)}</td>
          <td>${item.units}</td>
          <td>${currencyFormatter.format(item.unitPrice)}</td>
          <td>${currencyFormatter.format(subtotal)}</td>
        </tr>`;
    })
    .join("");
  const total = sumLineItems(deal.lineItems);
  return `
    <h2>Items</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total">
          <td colspan="3">TOTAL</td>
          <td>${currencyFormatter.format(total)}</td>
        </tr>
      </tbody>
    </table>`;
}

function signaturesHtml(company: string): string {
  return `
    <div class="signatures">
      <h2>Signatures of Agreement</h2>
      <div class="sig-grid">
        <div class="sig-cell">
          <div>${escapeHtml(company)}</div>
          <div class="sig-line"></div>
        </div>
        <div class="sig-cell">
          <div>Idrive Inc</div>
          <div class="sig-line"></div>
        </div>
      </div>
    </div>`;
}

/**
 * Self-contained HTML document framing proposed (non-binding) pricing for a
 * prospective sale. Layout mirrors an internal Idrive Inc quote reference:
 * sender header, centered title, a colored details bar with a document id,
 * a details list, an itemized table, a signatures block, and a validity note.
 */
export function buildQuoteHtml(
  deal: Pick<Deal, "id" | "name" | "company" | "value" | "owner" | "closeDate" | "lineItems">,
): string {
  const documentId = buildDocumentId(deal.id, "quote");
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Quote — ${escapeHtml(deal.company)}</title>
    <style>${DOCUMENT_STYLE}</style>
  </head>
  <body>
    ${senderHeaderHtml()}
    <h1>Purchase Quote</h1>
    ${detailsBarHtml("Quote details", documentId)}
    ${dealInfoBlockHtml(deal)}
    ${lineItemsTableHtml(deal)}
    ${signaturesHtml(deal.company)}
    <p class="note"><strong>Note:</strong> Idrive Inc's Quote is valid for <strong>30 Days</strong> unless the original scope of the project changes from the initial agreement. It then becomes null and void and a new Quote will be issued. Customer is responsible for all shipping costs associated with project, and can provide a shipping number if preferred.</p>
  </body>
</html>`;
}

/**
 * Self-contained HTML document framing binding contract terms for a deal.
 * The 5 contract-term fields are always-populated required `Deal` fields
 * (never the optional post-Won-only fields), so this needs no stage-based
 * null handling (D-01's always-available gating). Same visual layout as
 * `buildQuoteHtml`, extended with the contract-term details and a
 * binding-agreement note instead of the Quote's 30-day validity note.
 */
export function buildAgreementHtml(
  deal: Pick<
    Deal,
    | "id"
    | "name"
    | "company"
    | "value"
    | "owner"
    | "lineItems"
    | "contractTermMonths"
    | "frequency"
    | "currency"
    | "prorata"
    | "gracePeriodDays"
  >,
): string {
  const documentId = buildDocumentId(deal.id, "agreement");
  const ltv = computeLifetimeContractValue(deal);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Agreement — ${escapeHtml(deal.company)}</title>
    <style>${DOCUMENT_STYLE}</style>
  </head>
  <body>
    ${senderHeaderHtml()}
    <h1>Service Agreement</h1>
    ${detailsBarHtml("Agreement details", documentId)}
    ${dealInfoBlockHtml(deal)}
    ${lineItemsTableHtml(deal)}
    <dl>
      <dt>Contract Term</dt>
      <dd>${deal.contractTermMonths} months</dd>
      <dt>Billing Frequency</dt>
      <dd>${escapeHtml(deal.frequency)}</dd>
      <dt>Currency</dt>
      <dd>${escapeHtml(deal.currency)}</dd>
      <dt>Prorata</dt>
      <dd>${deal.prorata ? "Yes" : "No"}</dd>
      <dt>Grace Period</dt>
      <dd>${deal.gracePeriodDays} days</dd>
      <dt>LTV</dt>
      <dd>${currencyFormatter.format(ltv)}</dd>
    </dl>
    ${signaturesHtml(deal.company)}
    <p class="note"><strong>Note:</strong> This Agreement is binding upon signature by both parties and supersedes any prior Quote issued for this deal.</p>
  </body>
</html>`;
}
