---
phase: 05
slug: confidence-based-forecast-breakdown
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-09-16
---

# Phase 05 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser (user clicks the Confidence cell, or views the breakdown table) -> React component state -> Zustand store (in-memory) -> re-render | This plan's entire input surface — no network boundary exists in this frontend-only prototype | Confidence-level enum value; deal/line-item strings and numbers already in the in-memory mock store |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-05-01 | Tampering | `ConfidenceCell`'s commit path (e.g. a spoofed `updateDeal` call via dev-tools console, bypassing the UI) | low | mitigate | `dealEditSchema.shape.confidenceLevel.safeParse` rejects any value outside the 4-member enum before `updateDeal` is ever called — identical pattern already used for name/value/owner/closeDate. Verified: `ConfidenceCell.tsx:57` calls `safeParse`; `deal-edit-schema.ts:13` declares `z.enum(["100","80","50","open-to-rfp"])`. | closed |
| T-05-02 | Tampering / Information Disclosure | Account Name / Model / Services strings rendered into the new breakdown table's DOM | low | mitigate | React's default JSX interpolation auto-escapes every rendered value; no `dangerouslySetInnerHTML` anywhere in `ConfidenceCell` or `ForecastBreakdownTable`. Verified: grep for `dangerouslySetInnerHTML` across both files returns no matches. | closed |
| T-05-03 | Denial of Service / Integrity | Divide-by-zero in `computeArpu`/`computeGroupTotals` when a deal or group has zero service-line-item Quantity | low | mitigate | Explicit `quantity === 0 ? null : mrr / quantity` guard renders "—" instead of `NaN`/`Infinity` leaking into a cell or an aggregated total. Verified: `deal-metrics.ts:72`. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|

*No accepted risks.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-16 | 3 | 3 | 0 | Claude (secure-phase, L1 short-circuit — plan-time register, all mitigations grep-verified) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-16
