---
phase: 03
slug: deal-terms-wizard
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-09-09
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser (user-typed deal-terms fields in the Add Deal wizard) -> react-hook-form/zod validation -> in-memory Zustand store -> mock repository | The wizard's 5 new fields (Prorata, Grace Period, Contract Term, Frequency, Currency) plus the existing 6 step-1 fields are this plan's untrusted-input surface | Form input values (numeric, enum, boolean) — no PII, no external network egress |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-01 | Tampering | Unbounded/negative numeric input on `gracePeriodDays`/`contractTermMonths` | medium | mitigate | `addDealStep2Schema`'s `.nonnegative()` + `.max(3650)`/`.max(600)` bounds (`add-deal-schema.ts:34-40`) — verified present in code | closed |
| T-03-02 | Tampering | Arbitrary/out-of-enum string bypassing the Prorata/Frequency/Currency `Select` controls | low | mitigate | `z.enum()` constraints on all three fields (`add-deal-schema.ts:32,41,44`) — verified present in code, matches existing `group` field's `z.enum()` pattern | closed |
| T-03-03 | Tampering | A network call sneaking into the wizard's submit or field-commit path | medium | mitigate | Grep for `fetch(`/`axios`/`XMLHttpRequest` across all 5 plan-modified files returns zero matches — deal creation resolves only through `dealsRepository.create()` (unchanged call site) | closed |
| T-03-04 | Repudiation / Integrity | The 5 new deal-terms fields silently diverging from what the user actually entered (defaulted values indistinguishable from deliberately-entered ones) | low | accept | See Accepted Risks Log below — no code-level mitigation exists this phase by design | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03-01 | T-03-04 | A user can click Next then Create Deal without touching any step-2 field; the resulting Deal record (Prorata=No, Grace Period=0, Contract Term=0, Frequency=Monthly, Currency=USD) is then indistinguishable from one where the user genuinely reviewed and chose those values. This was flagged by the planner as an unresolved, judgment-tier transparency concern (no touched-state tracking exists this phase) and surfaced to the human at UAT (Test 6). The human reviewer confirmed this is acceptable for Phase 3's scope as specified — consistent with this project's existing accepted-risk precedent for judgment-tier concerns (02-02-PLAN.md's DEAL-05 prohibition). Revisit only if a future phase (e.g. the contract/quote-template consumer this data is captured for) needs provable deliberate entry. | User (via 03-UAT.md Test 6) | 2026-09-09 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-09 | 4 | 4 | 0 | Claude (gsd-secure-phase, short-circuit path — register authored at plan time, ASVS L1, threats_open: 0 confirmed by direct code inspection, no auditor agent spawn required) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-09
