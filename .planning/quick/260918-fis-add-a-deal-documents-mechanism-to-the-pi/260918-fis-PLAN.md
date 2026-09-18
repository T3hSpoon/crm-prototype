---
phase: deal-documents
plan: 1
type: execute
wave: 1
depends_on: []
autonomous: true
files_modified:
  - src/shared/types/deal.ts
  - src/data/deals-repository.ts
  - src/data/mock/mock-deals-repository.ts
  - src/data/mock/seed-data.ts
  - src/shared/utils/document-templates.ts
  - src/shared/utils/document-templates.test.ts
  - src/features/pipeline/store/pipelineStore.ts
  - src/features/pipeline/store/pipelineStore.test.ts
  - src/features/dashboard/dashboard-metrics.test.ts
  - src/features/forecast/forecast-breakdown.test.ts
  - src/features/pipeline/components/DealTable.tsx
  - src/features/pipeline/components/LineItemsTable.tsx

must_haves:
  truths:
    - "Every deal, regardless of pipeline stage, has Generate Quote and Generate Agreement actions available (D-01, locked)"
    - "Clicking Generate Quote/Generate Agreement produces a real HTML document (format: 'HTML') populated with that deal's company/value/line items (and, for Agreement, its contract terms), wrapped in new Blob([html], {type:'text/html'}) + URL.createObjectURL — never a PDF-generation library (D-03, locked)"
    - "A user can upload a real PDF file to any deal via a file input restricted to application/pdf; the resulting document has format: 'PDF'"
    - "Documents persist only in the Zustand pipelineStore's in-memory state, round-tripped through dealsRepository exactly like every other deal field — gone on refresh (D-02, locked)"
    - "DealTable's LAST column (after Stage) shows a 'No assets' tag for deals with zero documents, or one small button per document labeled with its format in capital letters, tooltipped (title attribute) with its fileName, that opens/downloads it via its object URL"
    - "Every seeded deal starts with an empty documents array, and newly created deals also start with an empty documents array"
  artifacts:
    - path: "src/shared/types/deal.ts"
      provides: "DealDocumentFormat ('HTML'|'PDF'), DealDocument (id, fileName, format, url, createdAt), Deal.documents: DealDocument[]"
    - path: "src/shared/utils/document-templates.ts"
      provides: "buildQuoteHtml, buildAgreementHtml (pure, deal-data-populated HTML string builders) + escapeHtml"
    - path: "src/features/pipeline/store/pipelineStore.ts"
      provides: "generateDocument(dealId, kind) and uploadDocument(dealId, file) actions"
    - path: "src/data/deals-repository.ts"
      provides: "DealsRepository.update()'s Pick type widened to include 'documents'"
    - path: "src/data/mock/mock-deals-repository.ts"
      provides: "MockDealsRepository.create() defaults documents: []; update() Pick widened to match deals-repository.ts"
    - path: "src/data/mock/seed-data.ts"
      provides: "documents: [] on every seeded deal"
    - path: "src/features/pipeline/components/DealTable.tsx"
      provides: "last-position 'Documents' column (No assets tag / per-document buttons)"
    - path: "src/features/pipeline/components/LineItemsTable.tsx"
      provides: "Generate Quote / Generate Agreement / Upload PDF controls"
  key_links:
    - from: "LineItemsTable's Generate/Upload controls"
      to: "pipelineStore.generateDocument/uploadDocument"
      via: "usePipelineStore.getState() action calls, mirroring commitLineItems' existing call shape"
      pattern: "usePipelineStore.getState()."
    - from: "pipelineStore.generateDocument/uploadDocument"
      to: "dealsRepository.update(dealId, { documents })"
      via: "append-then-replace-by-id (never overwritten, never by array index — matches moveStage/moveToLost/moveToWon/updateDeal's existing pattern)"
      pattern: "documents: [...current.documents, doc]"
    - from: "DealTable's Documents column"
      to: "the same pipelineStore deals array every other column reads"
      via: "info.row.original.documents"
      pattern: "info.row.original.documents"
---

<objective>
Add a deal-documents mechanism to the Pipeline feature (quick task 260918-fis): every `Deal` gets a `documents: DealDocument[]` field; "Generate Quote" and "Generate Agreement" actions are always available on any deal regardless of pipeline stage and produce a static HTML template (not a real PDF) turned into a `Blob` + object URL; an "Upload PDF" mechanism wraps a real `application/pdf` `File` in an object URL the same way; and a new last-position "Documents" column on `DealTable.tsx` renders either a "No assets" tag or one small format-labeled button per document.

This plan is ordered as a logic-first tracer: Task 1 proves the entire document-generation/upload mechanism end-to-end at the data/store layer (type -> repository -> seed -> pure HTML template builders -> store actions), verified by real Vitest tests before any UI exists — this is where the actual architectural risk lives (repository Pick-widening, Blob/object-URL semantics, append-not-clobber state updates). Task 2 is the expansion that wires the already-proven mechanism into the two UI surfaces (DealTable's Documents column, LineItemsTable's trigger controls), completing the real, user-visible, end-to-end capability. Task 1 also fixes two pre-existing test-only `Deal` object factories (`dashboard-metrics.test.ts`, `forecast-breakdown.test.ts`) that construct full `Deal` literals and would otherwise fail to compile the moment `documents` becomes a required field — this is forced, atomic type-propagation, not scope creep.

Purpose: gives every deal a lightweight, in-memory document trail (quotes, agreements, uploaded contracts) demoable at any pipeline stage, without adding a PDF-generation dependency or a persistence layer — consistent with this prototype's frontend-only, mock-data constraints.

Output: `Deal`/`DealDocument` types, repository plumbing, seed defaults, `document-templates.ts`, `pipelineStore` actions (all covered by new Vitest tests), and the two UI surfaces (`DealTable.tsx` Documents column, `LineItemsTable.tsx` trigger controls) wired together.
</objective>

<execution_context>
@C:/gh-repos/eld/.claude/gsd-core/workflows/execute-plan.md
@C:/gh-repos/eld/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@C:/gh-repos/eld/src/shared/types/deal.ts
@C:/gh-repos/eld/src/data/deals-repository.ts
@C:/gh-repos/eld/src/data/mock/mock-deals-repository.ts
@C:/gh-repos/eld/src/data/mock/seed-data.ts
@C:/gh-repos/eld/src/data/mock/seed-data.test.ts
@C:/gh-repos/eld/src/features/pipeline/store/pipelineStore.ts
@C:/gh-repos/eld/src/features/pipeline/components/DealTable.tsx
@C:/gh-repos/eld/src/features/pipeline/components/LineItemsTable.tsx
@C:/gh-repos/eld/src/features/pipeline/components/EditableCell.tsx
@C:/gh-repos/eld/src/features/pipeline/components/ConfidenceCell.tsx
@C:/gh-repos/eld/src/shared/utils/deal-metrics.ts
@C:/gh-repos/eld/src/shared/utils/line-items.ts
@C:/gh-repos/eld/src/components/ui/button.tsx
@C:/gh-repos/eld/src/components/ui/input.tsx
@C:/gh-repos/eld/src/features/forecast/forecast-breakdown.test.ts
@C:/gh-repos/eld/src/features/dashboard/dashboard-metrics.test.ts
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Deal document data model, repository plumbing, HTML templates, and store actions — proven end-to-end</name>
  <files>src/shared/types/deal.ts, src/data/deals-repository.ts, src/data/mock/mock-deals-repository.ts, src/data/mock/seed-data.ts, src/shared/utils/document-templates.ts, src/shared/utils/document-templates.test.ts, src/features/pipeline/store/pipelineStore.ts, src/features/pipeline/store/pipelineStore.test.ts, src/features/dashboard/dashboard-metrics.test.ts, src/features/forecast/forecast-breakdown.test.ts</files>
  <behavior>
    - buildQuoteHtml(deal) returns an HTML string containing the deal's company, name, owner, expected close date, and formatted value, plus (when lineItems is non-empty) each line item's product/SKU/type/units/unit price/subtotal — with every deal-derived free-text field HTML-escaped.
    - buildAgreementHtml(deal) returns an HTML string with the same company/deal info block and conditional line-items table, PLUS contractTermMonths, frequency, currency, prorata (Yes/No), gracePeriodDays, and the computed Lifetime Contract Value.
    - generateDocument(dealId, "quote") appends exactly one DealDocument (format: "HTML", url starting with "blob:") to that deal's documents array, leaving other deals/documents untouched.
    - generateDocument(dealId, "agreement") behaves the same way; calling it after generateDocument(dealId, "quote") on the same deal results in 2 documents (never overwrites).
    - uploadDocument(dealId, file) with an application/pdf File appends a DealDocument with format: "PDF", fileName equal to the File's name, and a blob: url.
    - uploadDocument(dealId, file) with a non-application/pdf File rejects (throws) and leaves that deal's documents array unchanged.
    - A freshly loaded deal's documents array starts empty (seed-data.ts's documents: [] default, exercised via usePipelineStore.getState().load()).
  </behavior>
  <action>
Per D-02/D-03 (locked): documents are in-memory only in the Zustand pipelineStore, exactly like every other piece of deal data, round-tripped through `dealsRepository` the same way `moveStage`/`moveToLost`/`moveToWon`/`updateDeal` already do — never mutated directly, never bypassing the repository seam.

In `deal.ts`, add `export type DealDocumentFormat = "HTML" | "PDF";` and a `DealDocument` interface (`id: string`, `fileName: string`, `format: DealDocumentFormat`, `url: string` — object URL from `URL.createObjectURL`, valid only for the browser session — `createdAt: string` ISO 8601), doc-commented in the same style as `LineItem`. Add `documents: DealDocument[]` to the `Deal` interface right after `lineItems`, with a comment noting it's quick task 260918-fis and, like `lineItems`, starts empty and is never part of `NewDealInput` — new deals get it set only inside `MockDealsRepository.create()`.

In `deals-repository.ts`, widen `DealsRepository.update()`'s `Pick<Deal, ...>` union to add `"documents"`.

In `mock-deals-repository.ts`: `create()` gets a new `documents: [],` line immediately after `lineItems: [],` (comment: new deals start with no documents — Generate Quote/Agreement/Upload PDF add to this array after creation). `update()`'s `Pick<Deal, ...>` union also gets `"documents"` added, matching `deals-repository.ts` exactly.

In `seed-data.ts`, add `documents: [],` to `buildSeedDeal()`'s returned object — every seeded deal starts with an empty array; no generator ever writes into it.

Fix the two pre-existing test-only full-`Deal`-literal factories so the suite keeps compiling once `documents` becomes required: in `dashboard-metrics.test.ts`'s `deal(overrides)` and `forecast-breakdown.test.ts`'s `deal(overrides)`, add `documents: overrides.documents ?? [],` alongside the existing `lineItems: overrides.lineItems ?? [],` line. No other change to either file.

Create `document-templates.ts` (new file, mirrors `deal-metrics.ts`/`line-items.ts`'s pure-function module shape — no side effects, no store/repository imports). Add a private `escapeHtml(value: string): string` helper escaping `&`, `<`, `>`, `"`, `'`. Every deal-derived free-text field (company, deal name, owner, line-item `productOrService`/`sku` — all user-editable via `EditableCell`/`LineItemsTable`) MUST be passed through `escapeHtml` before interpolation, since the generated HTML is opened directly in a browser tab (mitigates T-fis-01, see `<threat_model>`). Add a module-scope `currencyFormatter` (`Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })`, matching `DealTable.tsx`/`LineItemsTable.tsx`'s existing convention) and a private `lineItemsTableHtml(deal: Pick<Deal, "lineItems">)` helper producing either a "No line items." paragraph or an HTML `<table>` (Product/Service, SKU, Type, Units, Unit Price, Subtotal columns, plus a Total row) built from `computeSubtotal`/`sumLineItems` (`line-items.ts`) — never reimplement that math. Export `buildQuoteHtml(deal: Pick<Deal, "name"|"company"|"value"|"owner"|"closeDate"|"lineItems">): string` — a self-contained HTML document with an inline `<style>` block (basic body/heading/table/definition-list styling), heading "Quote", one line of copy framing it as proposed pricing for a prospective sale (not binding), a company/deal info block (company, deal name, owner, expected close date via `deal.closeDate.slice(0, 10)` matching `EditableCell`'s existing date-slice convention, quoted value via `currencyFormatter`), and `lineItemsTableHtml(deal)`. Export `buildAgreementHtml(deal: Pick<Deal, "name"|"company"|"value"|"owner"|"lineItems"|"contractTermMonths"|"frequency"|"currency"|"prorata"|"gracePeriodDays">): string` — same shell, heading "Agreement", copy framing it as binding contract terms for a deal, the same company/deal info block, `lineItemsTableHtml(deal)`, PLUS a contract-terms block: contract term in months, billing frequency, currency, prorata (Yes/No), grace period in days, and Lifetime Contract Value via `computeLifetimeContractValue` (`deal-metrics.ts`). These 5 contract-term fields are always-populated required `Deal` fields (never the optional post-Won-only fields like `contractSignedDate`), so Agreement generation needs no stage-based null handling — consistent with D-01's always-available gating.

Create `document-templates.test.ts` (new) covering the first two `<behavior>` bullets above, including one case that feeds an unescaped `<script>`-bearing company/line-item name through and asserts the raw tag never appears in the output while its escaped form does.

In `pipelineStore.ts`, add two new actions to `PipelineState`: `generateDocument: (dealId: string, kind: "quote" | "agreement") => Promise<void>` and `uploadDocument: (dealId: string, file: File) => Promise<void>`. Both follow the exact try/catch + `console.error(...)` + rethrow pattern already used by `moveToLost`/`moveToWon`/`updateDeal` (never swallow the rejection). `generateDocument`: look up the current deal via `get().deals.find(...)` (throw `Deal with id "{id}" not found` if missing, matching the repository's own not-found message format), build the HTML via `buildQuoteHtml`/`buildAgreementHtml` per `kind`, wrap it `new Blob([html], { type: "text/html" })`, get a URL via `URL.createObjectURL(blob)` (D-03, locked — never a PDF-generation library), construct a `DealDocument` (`id: crypto.randomUUID()` — matches `LineItemsTable.tsx`'s existing `handleAdd` convention — `fileName: \`${kind === "quote" ? "Quote" : "Agreement"} - ${current.company}.html\``, `format: "HTML"`, that url, `createdAt: new Date().toISOString()`), call `dealsRepository.update(dealId, { documents: [...current.documents, doc] })`, then replace the deal by id in `deals` exactly like every other action (never by array index — research/PITFALLS.md Pitfall 5). `uploadDocument`: guard `file.type !== "application/pdf"` and throw `new Error("Only PDF files can be uploaded.")` BEFORE touching the repository — a second, store-level enforcement of the file input's `accept="application/pdf"` restriction (mitigates T-fis-02, see `<threat_model>`), since the `accept` attribute alone doesn't block an OS "All files" picker selection. On success: `URL.createObjectURL(file)` directly (the File already IS the real PDF, no Blob wrapping needed), a `DealDocument` with `fileName: file.name`, `format: "PDF"`, and the same append+update+replace-by-id flow as `generateDocument`.

Create `pipelineStore.test.ts` (new) covering the remaining `<behavior>` bullets above — call `usePipelineStore.getState().load()` once (in a `beforeAll`) to populate `deals` from the real `dealsRepository`, then exercise `generateDocument`/`uploadDocument` against real deal ids from that array, asserting on `usePipelineStore.getState().deals.find(...)`.
  </action>
  <verify>
    <automated>npx vitest run src/shared/utils/document-templates.test.ts src/features/pipeline/store/pipelineStore.test.ts src/features/dashboard/dashboard-metrics.test.ts src/features/forecast/forecast-breakdown.test.ts && npx tsc -b</automated>
  </verify>
  <done>DealDocument/documents exist on Deal; deals-repository.ts and mock-deals-repository.ts round-trip a `documents` patch through update() exactly like every other field, and create() defaults it to []; seeded deals start with documents: []; document-templates.ts exports buildQuoteHtml/buildAgreementHtml producing escaped, deal-data-populated HTML; pipelineStore.generateDocument/uploadDocument append (never replace) a DealDocument via the repository and update state by id; the two pre-existing full-Deal test factories still compile; every new/updated test passes and `npx tsc -b` is clean.</done>
</task>

<task type="auto">
  <name>Task 2: Documents column (DealTable) + Generate Quote/Agreement/Upload PDF controls (LineItemsTable)</name>
  <files>src/features/pipeline/components/DealTable.tsx, src/features/pipeline/components/LineItemsTable.tsx</files>
  <action>
In `LineItemsTable.tsx`: add a new required prop `deal: Deal` to `LineItemsTableProps` (used only by the new Document Actions section — existing `lineItems`/`value`/`overridden` prop reads are untouched). Import the `Deal` type (the file already imports `LineItem`/`LineItemType` from the same module) and `Input` from `@/components/ui/input`. Add a second, independent pending/error state pair scoped to document actions — `isDocPending`/`docError` — separate from the existing line-item `isPending`/`error` (mirrors that existing state-machine shape from this same file and from `EditableCell.tsx`, but keeps the two concerns independent so an in-flight document generation never disables line-item editing or vice versa). Add a new section below the existing "Add Line Item"/"Reset to sum" button row (same flex-row pattern, `border-t border-border pt-2` separator): a "Generate Quote" `Button` (`variant="outline" size="sm"`, `disabled={isDocPending}`) calling a `handleGenerate("quote")` helper; a "Generate Agreement" `Button`, same shape, calling `handleGenerate("agreement")`; and `<Input type="file" accept="application/pdf" disabled={isDocPending} className="max-w-48" onChange={handleUpload} aria-label="Upload PDF" />` for Upload PDF (`Input`'s existing `file:`-prefixed Tailwind classes already style the native file-picker button — no new component needed). `handleGenerate(kind: "quote" | "agreement")`: guard `isDocPending`, set it true, `await usePipelineStore.getState().generateDocument(dealId, kind)`, clear `docError` on success, set `docError` to `UPDATE_FAILED_MESSAGE` on catch (reuse the shared constant — do not invent new copy), reset `isDocPending` in `finally`. `handleUpload(e: ChangeEvent<HTMLInputElement>)`: read `e.target.files?.[0]`, immediately reset `e.target.value = ""` (so re-selecting the same filename later still fires `onChange`), guard `!file || isDocPending`, then the same try/catch/finally shape calling `usePipelineStore.getState().uploadDocument(dealId, file)`. Render `docError` the same way the existing line-items `error` renders (`role="alert"` paragraph, same classes).

In `DealTable.tsx`: pass a new `deal={row.original}` prop through to `<LineItemsTable>` in the expanded-row block, alongside the existing `dealId`/`lineItems`/`value`/`overridden` props. Add a new `columnHelper.display({...})` entry to the `columns` array as the LAST entry — after the existing `id: "stage"` entry, so it becomes the last column overall (since `tableColumns` always spreads `columns` after `expandColumn`): `id: "documents"`, `header: "Documents"`, `enableGlobalFilter: false`, `cell: (info) => {...}`. Cell logic: read `info.row.original.documents`; if empty, render the SAME "No assets" tag styling `GroupSection.tsx`'s deal-count badge and `OwnerLeaderboard.tsx`'s rank badge already use elsewhere in this codebase (`rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium text-muted-foreground` span with the text "No assets") — do not invent new tag styling. Otherwise render a `flex flex-wrap items-center gap-1` container with one `<Button asChild variant="outline" size="xs" key={doc.id}>` per document, wrapping `<a href={doc.url} download={doc.fileName} title={doc.fileName} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{doc.format.toUpperCase()}</a>` — `Button`'s existing `asChild` + Radix `Slot` pattern is already used elsewhere in this codebase (e.g. `StageSelect.tsx`'s `PopoverAnchor asChild`). The anchor's `download` attribute triggers a real download/open of the object URL; `title` is the native-tooltip filename; the visible label is the format in capital letters (`DealDocumentFormat` is already `"HTML" | "PDF"`, so `.toUpperCase()` is a defensive no-op, not a functional requirement).
  </action>
  <verify>
    <automated>npx tsc -b && test $(grep -n 'id: "stage"' src/features/pipeline/components/DealTable.tsx | head -1 | cut -d: -f1) -lt $(grep -n 'id: "documents"' src/features/pipeline/components/DealTable.tsx | head -1 | cut -d: -f1)</automated>
  </verify>
  <done>LineItemsTable renders Generate Quote / Generate Agreement / Upload PDF controls wired to Task 1's store actions with their own independent pending/error state; DealTable's last column ("Documents", positioned after Stage) renders a "No assets" tag for zero-document deals or one button per document (visible label = format in capital letters, title attribute = fileName, click opens/downloads via the object URL); `npx tsc -b` compiles clean and the Documents-after-Stage column-ordering check passes.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|--------------|
| User-editable deal text -> generated document HTML | `company`/`name`/`owner`/line-item `productOrService`/`sku` (editable via `EditableCell`/`LineItemsTable`) are interpolated into `document-templates.ts`'s HTML string, then rendered when the resulting Blob object URL is opened in a new browser tab |
| Local file picker -> uploadDocument | Any file the user selects via the "Upload PDF" file input, nominally restricted client-side by `accept="application/pdf"`, which browsers do not strictly enforce |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-fis-01 | Tampering (HTML/script injection into generated documents) | `document-templates.ts` buildQuoteHtml/buildAgreementHtml | medium | mitigate | `escapeHtml()` applied to every deal-derived free-text field (company, deal name, owner, line-item productOrService/sku) before interpolation into the template string |
| T-fis-02 | Spoofing (`accept="application/pdf"` UI-only restriction bypassed via an OS "All files" picker) | `pipelineStore.uploadDocument` | medium | mitigate | Store-level guard rejects any `File` whose `type !== "application/pdf"` before it is appended/labeled "PDF", independent of the input's `accept` attribute |
| T-fis-03 | Denial of Service (object URLs from `URL.createObjectURL` are never revoked, accumulating for the session's lifetime) | `pipelineStore.generateDocument`/`uploadDocument` | low | accept | Documents are in-memory only and the whole app's state resets on refresh (D-02, locked); acceptable for a frontend prototype demo session — object-URL revocation lifecycle is a real-backend-integration-phase concern, not this phase's |

</threat_model>

<verification>
- `npx vitest run` (or `npm test`) — full suite passes, including the new `document-templates.test.ts`/`pipelineStore.test.ts` and the fixed `dashboard-metrics.test.ts`/`forecast-breakdown.test.ts` factories.
- `npm run build` (`tsc -b && vite build`) — confirms `Deal`/`DealDocument` typings, the widened repository `Pick` types, and both UI components (`DealTable.tsx`'s new column, `LineItemsTable.tsx`'s new prop + controls) all type-check and bundle cleanly.
- Manual smoke check (`npm run dev`): expand any deal's row, click "Generate Quote" then "Generate Agreement", confirm the last table column shows two small "HTML" buttons whose tooltip is each document's fileName and whose click opens/downloads the corresponding HTML file; select a PDF via "Upload PDF" and confirm a third "PDF" button appears the same way.
</verification>

<success_criteria>
- Every deal has always-available Generate Quote / Generate Agreement / Upload PDF actions, regardless of pipeline stage.
- Generated documents are static HTML (format "HTML") built from a Blob + object URL — no PDF-generation library added.
- Uploaded documents are real PDFs (format "PDF") restricted to `application/pdf` at both the input and the store layer.
- Documents live only in pipelineStore's in-memory state, round-tripped through dealsRepository like every other deal field.
- DealTable's last column (after Stage) shows a "No assets" tag or one format-labeled, fileName-tooltipped, click-to-open button per document.
- All seeded and newly created deals start with an empty documents array.
- `npx vitest run` and `npm run build` both pass.
</success_criteria>

<output>
Create `.planning/quick/260918-fis-add-a-deal-documents-mechanism-to-the-pi/260918-fis-SUMMARY.md` when done.
</output>
