import type { Deal } from "@/shared/types/deal";
import { computeSubtotal, sumLineItems } from "@/shared/utils/line-items";
import { computeLifetimeContractValue } from "@/shared/utils/deal-metrics";

/**
 * Pure HTML document builders for a deal's Quote/Agreement documents (quick
 * task 260918-fis). Mirrors `deal-metrics.ts`/`line-items.ts`'s pure-function
 * module shape — no side effects, no store/repository imports. D-03 (locked):
 * these produce a static HTML string, never a real PDF — the caller
 * (`pipelineStore.generateDocument`) wraps the result in a `Blob` + object
 * URL, never a PDF-generation library.
 */

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
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

const DOCUMENT_STYLE = `
  body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 2rem; max-width: 720px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  p.copy { color: #555; margin-top: 0; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; margin: 1.5rem 0; }
  dt { font-weight: 600; }
  dd { margin: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #ddd; }
  th { background: #f5f5f5; }
  tr.total td { font-weight: 600; border-top: 2px solid #333; border-bottom: none; }
`;

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
          <td>${escapeHtml(item.sku)}</td>
          <td>${escapeHtml(item.type)}</td>
          <td>${item.units}</td>
          <td>${currencyFormatter.format(item.unitPrice)}</td>
          <td>${currencyFormatter.format(subtotal)}</td>
        </tr>`;
    })
    .join("");
  const total = sumLineItems(deal.lineItems);
  return `
    <table>
      <thead>
        <tr>
          <th>Product/Service</th>
          <th>SKU</th>
          <th>Type</th>
          <th>Units</th>
          <th>Unit Price</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total">
          <td colspan="5">Total</td>
          <td>${currencyFormatter.format(total)}</td>
        </tr>
      </tbody>
    </table>`;
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
      <dt>Owner</dt>
      <dd>${escapeHtml(deal.owner)}</dd>${closeDateRow}
      <dt>Value</dt>
      <dd>${currencyFormatter.format(deal.value)}</dd>
    </dl>`;
}

/**
 * Self-contained HTML document framing proposed (non-binding) pricing for a
 * prospective sale.
 */
export function buildQuoteHtml(
  deal: Pick<Deal, "name" | "company" | "value" | "owner" | "closeDate" | "lineItems">,
): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Quote — ${escapeHtml(deal.company)}</title>
    <style>${DOCUMENT_STYLE}</style>
  </head>
  <body>
    <h1>Quote</h1>
    <p class="copy">Proposed pricing for a prospective sale — not a binding agreement.</p>
    ${dealInfoBlockHtml(deal)}
    ${lineItemsTableHtml(deal)}
  </body>
</html>`;
}

/**
 * Self-contained HTML document framing binding contract terms for a deal.
 * The 5 contract-term fields are always-populated required `Deal` fields
 * (never the optional post-Won-only fields), so this needs no stage-based
 * null handling (D-01's always-available gating).
 */
export function buildAgreementHtml(
  deal: Pick<
    Deal,
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
  const ltv = computeLifetimeContractValue(deal);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Agreement — ${escapeHtml(deal.company)}</title>
    <style>${DOCUMENT_STYLE}</style>
  </head>
  <body>
    <h1>Agreement</h1>
    <p class="copy">Binding contract terms for this deal.</p>
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
  </body>
</html>`;
}
