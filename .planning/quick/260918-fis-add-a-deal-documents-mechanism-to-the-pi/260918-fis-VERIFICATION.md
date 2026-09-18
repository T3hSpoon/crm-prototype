---
phase: deal-documents
verified: 2026-09-18T11:40:00Z
status: human_needed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Expand any deal's row in the Pipeline board, click 'Generate Quote' then 'Generate Agreement', and confirm the last table column ('Documents') shows two small 'HTML' buttons whose native tooltip (title attribute) is each document's fileName, and clicking opens/downloads the corresponding HTML file with the deal's data correctly rendered (visually)."
  - test: "Select a real PDF file via the 'Upload PDF' file input on the same deal and confirm a third 'PDF' button appears in the Documents column, with a tooltip equal to the uploaded file's name, and clicking it opens/downloads the uploaded PDF."
  - test: "Attempt to select a non-PDF file via the OS 'All files' picker option (bypassing the accept=\"application/pdf\" filter) and confirm the store-level rejection surfaces the shared UPDATE_FAILED_MESSAGE inline error text near the Document Actions controls, without adding a document."
  why_human: "Visual rendering (button labels, tooltip display, generated HTML content readability, No assets tag placement, real file-picker interaction) was only verified via type-checking, unit tests (jsdom-free Vitest, no browser), and a successful production build in this session — no browser was available to visually confirm the rendered UI or open a generated document."
---

# Quick Task 260918-fis: Deal Documents Mechanism Verification Report

**Task Goal:** Add a deal-documents mechanism to the Pipeline feature — `Deal.documents: DealDocument[]` field, always-available Generate Quote/Generate Agreement (static HTML via Blob + object URL) and Upload PDF (application/pdf-restricted) actions, and a new last-position "Documents" column on `DealTable.tsx`.

**Verified:** 2026-09-18
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every deal, regardless of pipeline stage, has Generate Quote and Generate Agreement actions available | ✓ VERIFIED | `LineItemsTable.tsx` L389-407 renders both buttons unconditionally (no stage/outcome gating) inside the expanded-row Document Actions section, which `DealTable.tsx` renders for every expandable row regardless of group/stage. |
| 2 | Clicking Generate Quote/Generate Agreement produces a real HTML document (format: 'HTML') populated with the deal's data, wrapped in `new Blob([html], {type:'text/html'})` + `URL.createObjectURL` — never a PDF library | ✓ VERIFIED | `pipelineStore.ts` L115-142 `generateDocument`: builds html via `buildQuoteHtml`/`buildAgreementHtml`, `new Blob([html], { type: "text/html" })`, `URL.createObjectURL(blob)`, `format: "HTML"`. `document-templates.ts` populates company/name/owner/closeDate/value/line items (Quote) and additionally contractTermMonths/frequency/currency/prorata/gracePeriodDays/LTV (Agreement). No PDF library present anywhere in `package.json`/imports. `pipelineStore.test.ts` asserts `url.startsWith("blob:")` and format "HTML", and that a 2nd call on the same deal yields 2 documents (never overwrites) — all 5 tests pass. |
| 3 | A user can upload a real PDF file to any deal via a file input restricted to application/pdf; the resulting document has format: 'PDF' | ✓ VERIFIED | `LineItemsTable.tsx` L408-415: `<Input type="file" accept="application/pdf" ... onChange={handleUpload}>`. `pipelineStore.ts` `uploadDocument` L144-176 additionally guards `file.type !== "application/pdf"` (throws before touching the repository) and sets `format: "PDF"`, `fileName: file.name`, `url: URL.createObjectURL(file)`. `pipelineStore.test.ts` confirms both the accept-path (PDF appended) and reject-path (non-PDF rejected, array unchanged). |
| 4 | Documents persist only in the Zustand pipelineStore's in-memory state, round-tripped through dealsRepository exactly like every other deal field — gone on refresh | ✓ VERIFIED | `deals-repository.ts` and `mock-deals-repository.ts` both widen `update()`'s `Pick<Deal,...>` to include `"documents"`; `generateDocument`/`uploadDocument` call `dealsRepository.update(dealId, { documents: [...] })` then replace-by-id in `deals` state, identical to `moveStage`/`moveToLost`/`moveToWon`/`updateDeal`. No localStorage/IndexedDB/persistence import anywhere in the touched files — `MockDealsRepository` holds state only in a private in-memory array. |
| 5 | DealTable's LAST column (after Stage) shows a 'No assets' tag for deals with zero documents, or one small button per document labeled with its format in capital letters, tooltipped with fileName, that opens/downloads it via its object URL | ✓ VERIFIED | `DealTable.tsx` `columns` array: `id: "stage"` (L124-131) precedes `id: "documents"` (L132-164) — confirmed both by direct file read and by the plan's own line-number verify command (`COLUMN ORDER OK`). Cell renders "No assets" badge (reusing `GroupSection.tsx`'s exact badge classes) when `documents.length === 0`, else one `<Button asChild>` per doc wrapping `<a href={doc.url} download={doc.fileName} title={doc.fileName} ...>{doc.format.toUpperCase()}</a>`. |
| 6 | Every seeded deal starts with an empty documents array, and newly created deals also start with an empty documents array | ✓ VERIFIED | `seed-data.ts` L111 sets `documents: []` in `buildSeedDeal()`; `mock-deals-repository.ts` L54 sets `documents: []` in `create()`. `pipelineStore.test.ts`'s first test loads all 150 real seeded deals and asserts every one has `documents === []`. |

**Score:** 6/6 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/shared/types/deal.ts` | `DealDocumentFormat`, `DealDocument`, `Deal.documents` | ✓ VERIFIED | Exact shape (`id`, `fileName`, `format`, `url`, `createdAt`) present, doc-commented like `LineItem`. |
| `src/shared/utils/document-templates.ts` | `buildQuoteHtml`, `buildAgreementHtml`, `escapeHtml` | ✓ VERIFIED | Pure module, no store/repository imports; escaping applied to all deal-derived free-text fields; reuses `computeSubtotal`/`sumLineItems`/`computeLifetimeContractValue`. |
| `src/features/pipeline/store/pipelineStore.ts` | `generateDocument(dealId, kind)`, `uploadDocument(dealId, file)` | ✓ VERIFIED | Both actions present, append-only, try/catch/rethrow pattern matching existing actions. |
| `src/data/deals-repository.ts` | `update()`'s Pick widened to include `documents` | ✓ VERIFIED | Confirmed at L31. |
| `src/data/mock/mock-deals-repository.ts` | `create()` defaults `documents: []`; `update()` Pick widened | ✓ VERIFIED | Confirmed at L54 and L89. |
| `src/data/mock/seed-data.ts` | `documents: []` on every seeded deal | ✓ VERIFIED | Confirmed at L111. |
| `src/features/pipeline/components/DealTable.tsx` | last-position "Documents" column | ✓ VERIFIED | Confirmed positioned after "stage" column; renders both zero-doc and per-doc states. |
| `src/features/pipeline/components/LineItemsTable.tsx` | Generate Quote / Generate Agreement / Upload PDF controls | ✓ VERIFIED | Confirmed all three controls present with independent `isDocPending`/`docError` state. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `LineItemsTable`'s Generate/Upload controls | `pipelineStore.generateDocument`/`uploadDocument` | `usePipelineStore.getState().generateDocument(...)` / `.uploadDocument(...)` | ✓ WIRED | `handleGenerate`/`handleUpload` in `LineItemsTable.tsx` L152-180 call these directly. |
| `pipelineStore.generateDocument`/`uploadDocument` | `dealsRepository.update(dealId, { documents })` | append-then-replace-by-id | ✓ WIRED | `pipelineStore.ts` L132-136, L166-170: `documents: [...current.documents, doc]`, never index-based. |
| `DealTable`'s Documents column | pipelineStore deals array | `info.row.original.documents` | ✓ WIRED | `DealTable.tsx` L137: `info.row.original.documents`; `deal={row.original}` also passed to `LineItemsTable` at L304. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `DealTable.tsx` Documents column | `info.row.original.documents` | `usePipelineStore` deals array, populated via `dealsRepository.list()`/`.update()` (real in-memory repository, not a static array) | Yes | ✓ FLOWING |
| `LineItemsTable.tsx` Document Actions | `deal.documents.length` indicator | Same `row.original` prop, from the same live store array | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| document-templates.test.ts + pipelineStore.test.ts + fixed factory tests | `npx vitest run src/shared/utils/document-templates.test.ts src/features/pipeline/store/pipelineStore.test.ts src/features/dashboard/dashboard-metrics.test.ts src/features/forecast/forecast-breakdown.test.ts` | 4 files, 43 tests passed | ✓ PASS |
| Full project test suite | `npx vitest run` | 6 files, 55 tests passed | ✓ PASS |
| Type-check | `npx tsc -b` | clean, no output/errors | ✓ PASS |
| Documents column ordering (after Stage) | Task 2's own verify command (grep line-number comparison) | `COLUMN ORDER OK` | ✓ PASS |
| Production build | `npm run build` (`tsc -b && vite build`) | built in 586ms, no errors (only a pre-existing chunk-size warning unrelated to this change) | ✓ PASS |
| Generated HTML actually opens correctly in a browser / uploaded PDF actually downloads correctly | N/A — requires a browser | Not run | ? SKIP (routed to human verification) |

### Requirements Coverage

This is a quick task (not phase-based); no `requirements:` frontmatter field or REQUIREMENTS.md mapping applies. N/A.

### Anti-Patterns Found

None. Scanned all 12 files touched by this task for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`/"not yet implemented"/empty-return patterns — zero matches (the single `isPlaceholder` hit in `DealTable.tsx` is TanStack Table's own header-placeholder API property, not a stub marker).

### Human Verification Required

### 1. Generate Quote / Generate Agreement visual + download check

**Test:** Run `npm run dev`, expand any deal's row, click "Generate Quote" then "Generate Agreement".
**Expected:** The last table column ("Documents") shows two small "HTML" buttons; each button's native tooltip (hover) shows the document's fileName (e.g. "Quote - Acme Corp.html"); clicking a button opens/downloads the HTML file, and its rendered content shows the deal's company/value/line items (and, for Agreement, contract terms) correctly, with no raw `<script>`/unescaped tags visible.
**Why human:** No browser was available in this session — verification stopped at Vitest (Node-only, no DOM rendering) and a successful `vite build`. Visual layout, tooltip display, and file-open behavior are not observable from source/type-checking alone.

### 2. Upload PDF visual + download check

**Test:** On the same expanded deal row, select a real PDF file via the "Upload PDF" file input.
**Expected:** A third "PDF" button appears in the Documents column, tooltip shows the uploaded file's actual name, clicking it opens/downloads the exact uploaded PDF.
**Why human:** Same as above — requires a real browser file picker and object-URL download interaction.

### 3. Non-PDF rejection UI feedback

**Test:** Attempt to select a non-PDF file (e.g. via "All Files" in the OS picker, bypassing `accept="application/pdf"`).
**Expected:** No new document appears; the shared `UPDATE_FAILED_MESSAGE` inline error text appears near the Document Actions controls (`docError` state).
**Why human:** Requires manually bypassing the `accept` attribute via the OS file picker, an interaction not exercisable from unit tests.

### Gaps Summary

No gaps found. All 6 must-have truths are verified against actual code (not SUMMARY.md claims): types exist and are wired end-to-end (deal.ts -> repository -> store -> UI), the full test suite (55 tests, including the 12 new/updated tests for this task) passes, `npx tsc -b` and `npm run build` both succeed cleanly, no PDF-generation library was added, the "documents" column is confirmed last (after "stage") by direct file inspection, and no anti-pattern/stub markers were found in any of the 12 touched files.

The only outstanding item is genuinely un-verifiable without a browser (visual rendering, tooltip display, click-to-download behavior) — this routes the overall status to `human_needed` per the verification decision tree, matching the SUMMARY.md's own honest disclosure that this manual smoke check was not performed during the autonomous execution session.

---

_Verified: 2026-09-18_
_Verifier: Claude (gsd-verifier)_
