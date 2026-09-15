---
phase: 02
slug: deal-detail-line-items
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-09-09
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser (user-typed inline-table/line-item edits, manual Value override) → in-memory Zustand store → mock repository | All of this phase's writes — core-field inline edits, line-item CRUD, and the Value override path — are user-typed free text/numbers reaching `usePipelineStore.updateDeal()` | Deal/LineItem field values (strings, numbers, dates) — no PII, no secrets, no cross-session data |

**Note on scope drift since planning:** both plans' threat models were authored while a `DealDetailDrawer` existed as a second write path alongside inline table editing. A post-execution quick task (260908-f9d) removed the drawer entirely — `EditableCell` (inline table editing) is now the *only* write path for core fields, and the line-items sub-row (chevron-expand) is the only write path for line items. This reduces the attack surface (one validated path instead of two) rather than expanding it; each threat below was re-verified against the current code, not the as-planned code.

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | Tampering | `EditableCell` Value column accepting a negative/zero commit via a bypassed client check | medium | mitigate | `dealEditSchema.shape.value` is `z.coerce.number().positive()`; `EditableCell.commit()` calls `dealEditSchema.shape[columnId].safeParse(candidate)` before ever calling `updateDeal` — verified present in current `EditableCell.tsx` (line 84). (Originally the drawer also enforced this in parallel; the drawer is now removed, but this is the sole remaining write path and it independently enforces the same constraint.) | closed |
| T-02-02 | Tampering | Inline edit accidentally wired to a real network call | medium | mitigate | Repo-wide grep of `src/features/pipeline`, `src/data`, `src/shared` for `fetch(`, `axios`, `XMLHttpRequest` — zero matches. All writes resolve only through `dealsRepository`/`MockDealsRepository`. | closed |
| T-02-03 | Tampering / Information Disclosure | XSS via free-text Name/Owner rendered back into the table | low | mitigate | React's default JSX text-node escaping; repo-wide grep for `dangerouslySetInnerHTML` in the same three dirs — zero matches. | closed |
| T-02-04 | Spoofing / Elevation of Privilege | Entire app — no authentication exists | low | accept | Single-user, no backend, no session this milestone — explicitly out of scope per PROJECT.md. | closed |
| T-02-05 | Tampering | Client-side-only validation bypass (calling `usePipelineStore.getState().updateDeal(...)` directly from devtools, skipping zod validation) | low | accept | Acceptable at ASVS L1 for a no-backend, single-user local prototype — no server-side state to corrupt beyond the user's own in-memory browser session. | closed |
| T-02-06 | Tampering | Unbounded numeric input on units/unitPrice producing a nonsensical subtotal | medium | mitigate | `lineItemSchema`'s `units`/`unitPrice` are both `z.coerce.number().positive()` — verified present in current `deal-edit-schema.ts` (lines 35–36). | closed |
| T-02-07 | Tampering / Information Disclosure | XSS via free-text productOrService/sku rendered into the line-items table | low | mitigate | Same as T-02-03 — React default escaping, no `dangerouslySetInnerHTML` introduced. | closed |
| T-02-08 | Tampering | A network call sneaking into the line-item CRUD or rollup path | medium | mitigate | Same grep as T-02-02 covers `src/shared` (where `line-items.ts` lives) — zero matches; line-item commits resolve only through `dealsRepository`. | closed |
| T-02-09 | Repudiation / Integrity | A stored derived total (subtotal or deal-level total) silently drifting from the live computed sum | low | mitigate | `LineItem` has no `subtotal` field and `Deal` has no `total`/`computedValue` field — confirmed in current `shared/types/deal.ts` (comment at line 28: "subtotal is intentionally NOT a field here"); every total is computed via `line-items.ts` at render/commit time. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-04 | No authentication — single-user local prototype, no backend/session this milestone, per PROJECT.md constraints | Original plan (02-01-PLAN.md) | 2026-09-08 |
| AR-02-02 | T-02-05 | Client-side-only validation bypass via devtools — acceptable at ASVS L1 for a no-backend prototype with no server-side state to corrupt | Original plan (02-01-PLAN.md) | 2026-09-08 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-09 | 9 | 9 | 0 | Claude (orchestrator, L1 grep-depth per ASVS 1 short-circuit — no auditor subagent spawn needed) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-09
