---
phase: 06
slug: sales-dashboard
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-09-18
---

# Phase 6 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| In-memory store -> React render tree | The only boundary this phase touches across all 3 plans: `usePipelineStore`'s already-loaded, in-process `Deal[]` flowing into pure derived-data functions (`dashboard-metrics.ts`) and then into Recharts SVG output. No network, no user input form, no auth boundary exists anywhere in this phase (frontend-only prototype, PROJECT.md constraint). | In-memory mock deal/line-item data (no PII, no real customer data — deterministic faker-seeded fictional dataset) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-06-01 | Tampering / Information Disclosure | UnitTargetGauge, TargetVsActualChart, OwnerLeaderboard, ConversionFunnelChart, ClosedByOwnerChart (all dashboard chart/label/tooltip components) | low | mitigate | React's default JSX text escaping covers every dynamic value rendered (owner names, computed numbers, currency); no raw-HTML-insertion API used anywhere in `src/features/dashboard/` — verified via `grep -rn "dangerouslySetInnerHTML\|innerHTML" src/features/dashboard/` (0 matches) | closed |
| T-06-02 | Denial of Service | src/data/mock/seed-data.ts | low | mitigate | Seed volume fixed at `SEED_DEAL_COUNT = 150`, well below the "hundreds/thousands" threshold CLAUDE.md flags for needing `@tanstack/react-virtual` row virtualization | closed |
| T-06-03 | Denial of Service (client-side crash via NaN/Infinity render) | dashboard-metrics.ts (`computeUnitTargetPct`, `computeConversionFunnel`, `computeMonthlyWonUnits`, `computeOwnerLeaderboard`, `computeClosedByOwnerPerMonth`) | medium | mitigate | Every ratio function has an explicit divide-by-zero guard (`target === 0 → return 0`, `total === 0 ? 0 : count / total`); every bucketing function pre-seeds all buckets/owners at a real `0` rather than leaving them `undefined` — confirmed present via source read and covered by unit tests (40/40 passing) | closed |
| T-06-04 | Tampering (data-integrity: misleading business metrics) | DashboardPage.tsx | medium | mitigate | `DashboardPage` reads `usePipelineStore((s) => s.deals)` directly — the full unfiltered store, never a Pipeline-tab-filtered subset — verified via `grep -n "usePipelineStore" src/features/dashboard/components/DashboardPage.tsx` and independently confirmed by the phase verifier's Key Link Verification table | closed |
| T-06-05 | Information Disclosure (mock data mistaken for real identity) | dashboard-config.ts OWNER_ROSTER | low | accept | Fixed 5-name roster uses clearly generic/fictional names unaffiliated with any real iDrive employee — purely cosmetic demo data, never real PII | closed |
| T-06-06 | Information Disclosure (misleading data semantics) | ConversionFunnelChart.tsx | medium | mitigate | Funnel is a current-state snapshot, not a true historical conversion rate — disclosed via an unconditionally-rendered caption beneath the chart title (not conditional on any state, so it can never be silently omitted) — confirmed present via source read | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-06-01 | T-06-05 | Fixed owner roster uses generic/fictional names by design (must_haves.prohibitions in 06-01-PLAN.md) — no real employee identity is ever used in mock data, so there is no PII exposure to mitigate beyond the naming choice itself. | gsd-secure-phase (automated, ASVS L1) | 2026-09-18 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-18 | 6 | 6 | 0 | gsd-secure-phase (orchestrator, direct source verification — ASVS L1 grep-depth, no auditor subagent spawned per short-circuit rule) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-18
