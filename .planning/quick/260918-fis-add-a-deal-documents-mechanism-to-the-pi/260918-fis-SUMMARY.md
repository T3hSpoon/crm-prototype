---
phase: deal-documents
plan: 1
subsystem: ui
tags: [react, zustand, typescript, vitest, blob, html]

requires: []
provides:
  - "Deal.documents: DealDocument[] field (HTML/PDF format union) round-tripped through DealsRepository.update() like every other deal field"
  - "document-templates.ts: buildQuoteHtml/buildAgreementHtml — escaped, deal-data-populated static HTML string builders (no PDF-generation library)"
  - "pipelineStore.generateDocument(dealId, kind) and uploadDocument(dealId, file) — Blob/object-URL and real-File-object-URL document creation, append-only, in-memory only"
  - "DealTable's last column ('Documents') and LineItemsTable's Generate Quote / Generate Agreement / Upload PDF controls"
affects: [pipeline]

actuals:
  tokens: 7895
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Pure HTML-string template builder module (document-templates.ts) mirroring deal-metrics.ts/line-items.ts's no-side-effects, no-store-import shape"
    - "Blob + URL.createObjectURL for generated (not real) documents; File + URL.createObjectURL directly for real uploaded files — both produce the same DealDocument shape"
    - "Independent pending/error React state pairs per concern within one component (isPending/error for line items, isDocPending/docError for documents) so unrelated in-flight actions never block each other"

key-files:
  created:
    - src/shared/utils/document-templates.ts
    - src/shared/utils/document-templates.test.ts
    - src/features/pipeline/store/pipelineStore.test.ts
  modified:
    - src/shared/types/deal.ts
    - src/data/deals-repository.ts
    - src/data/mock/mock-deals-repository.ts
    - src/data/mock/seed-data.ts
    - src/features/pipeline/store/pipelineStore.ts
    - src/features/pipeline/components/DealTable.tsx
    - src/features/pipeline/components/LineItemsTable.tsx
    - src/features/dashboard/dashboard-metrics.test.ts
    - src/features/forecast/forecast-breakdown.test.ts

key-decisions:
  - "Task 1 executed as a TDD tracer: document-templates.test.ts and pipelineStore.test.ts written and confirmed RED (module/actions didn't exist) before document-templates.ts and the store actions were implemented (GREEN) — per plan's tdd=\"true\" gate"
  - "buildAgreementHtml's shared dealInfoBlockHtml helper made closeDate optional (only buildQuoteHtml supplies it) since Agreement's Pick<Deal,...> signature intentionally excludes closeDate — kept the two builders sharing one info-block renderer rather than duplicating markup"
  - "LineItemsTable's new deal prop is used to show a small '<n> documents' indicator next to the Generate/Upload controls, in addition to satisfying the plan's required-prop signature"

patterns-established:
  - "Document generation always goes through the repository seam (dealsRepository.update) and replace-by-id in Zustand state, identical to every other deal-mutating action — never a separate documents store or direct array mutation"

requirements-completed: []

coverage:
  - id: D1
    description: "Every deal has always-available Generate Quote / Generate Agreement actions producing escaped, deal-data-populated static HTML (Blob + object URL, never a PDF library)"
    verification:
      - kind: unit
        ref: "src/shared/utils/document-templates.test.ts#buildQuoteHtml/buildAgreementHtml (7 tests, includes script-injection escaping case)"
        status: pass
      - kind: unit
        ref: "src/features/pipeline/store/pipelineStore.test.ts#generateDocument(dealId, 'quote') appends exactly one HTML DealDocument with a blob: url, leaving other deals untouched"
        status: pass
      - kind: unit
        ref: "src/features/pipeline/store/pipelineStore.test.ts#generateDocument(dealId, 'agreement') after 'quote' on the same deal results in 2 documents (never overwrites)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Uploading a real application/pdf File produces a format: 'PDF' document; non-PDF files are rejected at the store layer even if selected via an OS 'All files' picker"
    verification:
      - kind: unit
        ref: "src/features/pipeline/store/pipelineStore.test.ts#uploadDocument(dealId, file) with an application/pdf File appends a PDF DealDocument with a matching fileName and a blob: url"
        status: pass
      - kind: unit
        ref: "src/features/pipeline/store/pipelineStore.test.ts#uploadDocument(dealId, file) with a non-application/pdf File rejects and leaves that deal's documents array unchanged"
        status: pass
    human_judgment: false
  - id: D3
    description: "Documents live only in pipelineStore's in-memory state, round-tripped through dealsRepository like every other deal field; every seeded and newly created deal starts with an empty documents array"
    verification:
      - kind: unit
        ref: "src/features/pipeline/store/pipelineStore.test.ts#a freshly loaded deal's documents array starts empty"
        status: pass
      - kind: other
        ref: "npx tsc -b — confirms DealsRepository/MockDealsRepository's widened Pick<Deal,...> types and mock-deals-repository.ts's create() documents: [] default all type-check"
        status: pass
    human_judgment: false
  - id: D4
    description: "DealTable's last column (after Stage) renders a 'No assets' tag for zero-document deals or one format-labeled, fileName-tooltipped, click-to-open button per document; LineItemsTable renders the Generate Quote/Generate Agreement/Upload PDF controls"
    verification:
      - kind: other
        ref: "npx tsc -b && test $(grep -n 'id: \"stage\"' DealTable.tsx) -lt $(grep -n 'id: \"documents\"' DealTable.tsx) — Task 2's own verify command"
        status: pass
      - kind: other
        ref: "npm run build (tsc -b && vite build) — confirms DealTable.tsx's new column and LineItemsTable.tsx's new prop/controls type-check and bundle cleanly"
        status: pass
    human_judgment: true
    rationale: "Visual rendering (button labels, tooltip text, No assets tag placement, file-picker interaction) was structurally verified via type-checking and a passing build only — no browser was available in this autonomous worktree session, matching the same limitation noted for Phase 6's dashboard widgets in STATE.md. A manual smoke check (npm run dev, expand a deal row, Generate Quote/Agreement, Upload PDF) is recommended before considering this UI-complete."

duration: ~20min
completed: 2026-09-18
status: complete
---

# Quick Task 260918-fis: Deal Documents Mechanism Summary

**Every Deal gets an always-available Generate Quote / Generate Agreement (static HTML via Blob + object URL) / Upload PDF mechanism, in-memory only, with a new last-position Documents column on the pipeline table.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-09-18
- **Completed:** 2026-09-18
- **Tasks:** 2
- **Files modified:** 12 (3 new, 9 modified)

## Accomplishments
- `Deal.documents: DealDocument[]` (new `DealDocumentFormat = "HTML" | "PDF"` type) added, round-tripped through `DealsRepository.update()`'s widened `Pick` type in both the interface and `MockDealsRepository` exactly like every other deal field; `create()` and every seeded deal default to `documents: []`.
- `document-templates.ts` exports `buildQuoteHtml`/`buildAgreementHtml` — pure, self-contained HTML-string builders reusing `computeSubtotal`/`sumLineItems`/`computeLifetimeContractValue` rather than reimplementing that math, with every deal-derived free-text field passed through a private `escapeHtml` helper (verified via a script-injection test case).
- `pipelineStore.generateDocument(dealId, kind)` wraps the built HTML in `new Blob([html], { type: "text/html" })` + `URL.createObjectURL` (D-03, locked — never a PDF-generation library) and appends (never replaces) a `DealDocument` via the repository, mirroring `moveToLost`/`moveToWon`/`updateDeal`'s existing try/catch/rethrow + replace-by-id pattern.
- `pipelineStore.uploadDocument(dealId, file)` rejects any `File` whose `type !== "application/pdf"` before touching the repository (a store-level backstop independent of the file input's `accept` attribute), then wraps the real PDF `File` directly via `URL.createObjectURL`.
- `DealTable.tsx`'s new last column ("Documents", after "Stage") renders a "No assets" tag (reusing `GroupSection.tsx`'s existing badge styling) or one small format-labeled `Button asChild` anchor per document, tooltipped with `fileName`, opening/downloading via the object URL.
- `LineItemsTable.tsx` gained a required `deal: Deal` prop and a new Document Actions row (Generate Quote / Generate Agreement / Upload PDF via a `type="file" accept="application/pdf"` input) with its own independent `isDocPending`/`docError` state, separate from the existing line-item editing state.
- Task 1 executed as a TDD tracer per the plan: `document-templates.test.ts` and `pipelineStore.test.ts` were written and run first, confirmed RED (`Cannot find module './document-templates'`, `generateDocument is not a function`), then `document-templates.ts` and the two store actions were implemented and the same run turned GREEN.

## Task Commits

Each task was committed atomically (Task 1 as TDD RED → GREEN, per its `tdd="true"` frontmatter):

1. **Task 1 (RED): Deal document data model, repository plumbing, HTML templates, and store actions — failing tests** - `972c7dc` (test)
2. **Task 1 (GREEN): document-templates.ts + pipelineStore actions implementation** - `2d48828` (feat)
3. **Task 2: Documents column (DealTable) + Generate/Upload controls (LineItemsTable)** - `71a6e26` (feat)

_Note: SUMMARY.md commit follows separately per this project's quick-task convention._

## Files Created/Modified
- `src/shared/types/deal.ts` - `DealDocumentFormat`/`DealDocument` types; `Deal.documents: DealDocument[]` field
- `src/data/deals-repository.ts` - `DealsRepository.update()`'s `Pick<Deal, ...>` widened to include `"documents"`
- `src/data/mock/mock-deals-repository.ts` - `create()` defaults `documents: []`; `update()` `Pick` widened to match
- `src/data/mock/seed-data.ts` - every seeded deal gets `documents: []`
- `src/shared/utils/document-templates.ts` (new) - `buildQuoteHtml`/`buildAgreementHtml` + `escapeHtml`
- `src/shared/utils/document-templates.test.ts` (new) - 7 tests covering both builders and HTML-escaping
- `src/features/pipeline/store/pipelineStore.ts` - `generateDocument`/`uploadDocument` actions
- `src/features/pipeline/store/pipelineStore.test.ts` (new) - 5 tests covering both actions end-to-end against real seeded deals
- `src/features/dashboard/dashboard-metrics.test.ts` / `src/features/forecast/forecast-breakdown.test.ts` - forced type-propagation fix: `deal()` test factories now set `documents: overrides.documents ?? []`
- `src/features/pipeline/components/DealTable.tsx` - last-position "Documents" column
- `src/features/pipeline/components/LineItemsTable.tsx` - Generate Quote/Generate Agreement/Upload PDF controls

## Decisions Made
- Followed the plan's TDD-tracer structure literally: RED commit bundles the type/repository/seed plumbing (schema, not tested behavior) alongside the two new failing test files, then a separate GREEN commit adds the actual `document-templates.ts`/store-action implementations.
- `dealInfoBlockHtml`'s `closeDate` parameter made optional (rather than duplicating the info-block markup) since `buildAgreementHtml`'s `Pick<Deal, ...>` signature intentionally omits `closeDate` per the plan.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. `URL.createObjectURL`/`Blob`/`File` are all natively available in this project's Vitest `node` test environment (confirmed via a quick Node REPL check before writing tests), so no jsdom/polyfill was needed for `pipelineStore.test.ts`'s real Blob/File assertions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The deal-documents mechanism is fully implemented, type-checked (`npx tsc -b`), covered by 12 new passing unit tests, and the full suite (`npm test`, 55 tests) plus `npm run build` both pass.
- A manual browser smoke check (per the plan's own `<verification>` section — expand a deal row, click Generate Quote/Generate Agreement, confirm the two "HTML" buttons and their tooltips/downloads, then Upload PDF and confirm a third "PDF" button) was not performed in this autonomous worktree session (no browser available) — recommended before considering the UI surface fully verified, mirroring the same noted limitation for Phase 6's dashboard widgets.
- No blockers for future work; `documents` is a fully-typed, repository-round-tripped field ready to extend (e.g. document deletion, real-backend persistence) without touching call sites beyond `src/data/`.

---
*Phase: deal-documents*
*Completed: 2026-09-18*
