---
phase: 04
slug: forecast-pipeline-analysis
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-09-15
---

# Phase 04 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser (user-typed search/filter text, clicked sort headers, clicked toggle pills) → React component state → TanStack Table row-model computation → rendered DOM | 04-01's entire untrusted-input surface — no network boundary exists in this frontend-only prototype | Free-text search string, numeric/date filter bounds, sort column selection |
| Browser (Zustand store's in-memory `deals`, read by ForecastPage/forecast-metrics.ts, rendered via Recharts SVG) | 04-02's entire data surface — no network boundary exists in this frontend-only prototype | Deal records (owner, value, dates, lostReason, contract terms) → aggregated chart/tile data |
| npm registry → local `node_modules` | `npm install recharts` (04-02 Task 2) pulled third-party code onto the dev machine | Third-party package source |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-04-01 | Tampering / Information Disclosure | Search/filter text and "no results" messaging rendered back into the DOM (`PipelineToolbar.tsx`) | low | mitigate | React's default JSX interpolation (`{value}`) auto-escapes every rendered value; confirmed zero `dangerouslySetInnerHTML` in `PipelineToolbar.tsx`/`DealTable.tsx` | closed |
| T-04-02 | Tampering / Integrity | Filter/sort logic accidentally mutating `usePipelineStore`'s canonical `deals` array or writing through a store action | medium | mitigate | `PipelineToolbar` is a pure props-in/callbacks-out component with zero `usePipelineStore` references (grep-confirmed); sorting goes through `getSortedRowModel()`, zero direct `.sort(` calls in `DealTable.tsx` (grep-confirmed, matches 04-VERIFICATION.md Truth #11) | closed |
| T-04-03 | Denial of Service | A malformed numeric/date filter bound silently matching zero rows or throwing during row-model computation | low | mitigate | `type="number"`/`type="date"` native inputs constrain entry; `isValueRangeValid`/`isCloseDateRangeValid` guard the min>max case before a filter is ever added to `columnFilters` (matches 04-VERIFICATION.md Truth #4) | closed |
| T-04-04 | Tampering / Information Disclosure | Free-text `lostReason`/`paymentTerms` values rendered into chart tooltips/labels (`LostBreakdownChart.tsx`, `ForecastPage.tsx`) | low | mitigate | React's default JSX interpolation auto-escapes; Recharts renders tick/tooltip text as React-managed SVG `<text>` nodes; confirmed zero `dangerouslySetInnerHTML` in either file | closed |
| T-04-05 | Tampering / Integrity | Stale `lostReason`/contract-term data (CR-01) silently corrupting FCST-02's aggregate counts | medium | mitigate | Centralized `clearPatchFor` helper called from all 3 stage-transition store actions (`moveStage`/`moveToLost`/`moveToWon`) — exactly 3 call sites confirmed (matches 04-VERIFICATION.md Truth #9) | closed |
| T-04-06 | Repudiation | Forecast stat tiles/charts present computed figures with no audit trail of which deals/fields fed them | low | accept | Single-user, frontend-only prototype with no persistence layer; consistent with this project's existing disposition for judgment-tier, non-security concerns (e.g. `03.1-SECURITY.md`'s accepted-risk items) | closed |
| T-04-SC | Tampering (supply chain) | `npm install recharts` (04-02 Task 2) | high | mitigate | `04-RESEARCH.md`'s Package Legitimacy Audit vetted `recharts` with an OK verdict (40.45M weekly downloads, real source repo, no postinstall script); installed version (`3.10.1`) confirmed resolved from the official npm registry in `package-lock.json` | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-04-01 | T-04-06 | No audit trail for forecast figures — acceptable for a single-user, frontend-only prototype with no persistence layer; consistent with prior-phase disposition for the same class of concern | Project convention (carried from 03.1-SECURITY.md) | 2026-09-15 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-15 | 7 | 7 | 0 | Claude (gsd-secure-phase, L1 grep-depth — short-circuit per ASVS level 1 with plan-time-authored register) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-15
