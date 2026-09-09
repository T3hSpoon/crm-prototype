# Requirements: iDrive CRM Prototype

**Defined:** 2026-08-28
**Core Value:** A working, demoable pipeline view — prospects flow through stages, lost deals are tracked with reasons, and won deals roll up as the contract list — solid enough to later wire into iDrive's existing project without a rebuild.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Pipeline

- [x] **PIPE-01**: User can view deals grouped by pipeline stage (Prospect, Lead, Opportunity, Deal/Won, Lost)
- [x] **PIPE-02**: User can move a deal from one pipeline stage to another
- [ ] **PIPE-03**: Won deals appear as a distinct group that serves as the "contracts made so far" list
- [ ] **PIPE-04**: User can search deals by name/company across the pipeline table
- [ ] **PIPE-05**: User can filter the pipeline table by owner, value, stage, or close date
- [ ] **PIPE-06**: User can sort the pipeline table by column (value, close date, owner)

### Deals

- [x] **DEAL-01**: User can add a new prospect/deal via a form
- [x] **DEAL-02**: User can edit a deal's fields inline (name, value, owner, close date)
- [x] **DEAL-03**: User can open a deal detail drawer/panel to view and edit its full details
- [x] **DEAL-04**: User can add, edit, and remove line items on a deal (product/service, SKU, units, unit price, subtotal, type)
- [x] **DEAL-05**: A deal's total value defaults to the sum of its line items, with the option to manually override it
- [x] **DEAL-06**: User can capture deal-terms/contract fields (Prorata, Grace Period, Contract Term, Frequency, Currency) via a 2-step Add Deal wizard, required for every new deal at creation, regardless of pipeline stage

### Lost Tracking

- [ ] **LOST-01**: User can mark a deal as lost, which requires selecting or entering a reason before the move completes
- [ ] **LOST-02**: A lost deal moves to a separate Lost group, distinct from active pipeline stages

### Won Tracking

- [ ] **WON-01**: Marking a deal as Won requires completing a contract terms form (start date, end date/term length, signed date, payment terms, final contract value) before the deal is added to the contracts list

### Forecast

- [ ] **FCST-01**: User can view a forecast page showing raw pipeline value, weighted/projected value (deal value × stage probability), and win rate
- [ ] **FCST-02**: User can view a breakdown of lost deals by reason and by stage on the forecast page

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Analytics

- **ANLY-01**: Stalled-deal flag — surface deals that have sat in a stage longer than expected

### Integration

- **INTG-01**: Real API/database persistence, replacing the mock data layer
- **INTG-02**: Authentication and multi-user pipelines with ownership-based filtering

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Kanban board view | Table-only for v1 per PROJECT.md; a second view doubles UI surface with no backend to persist per-view state |
| Calendar / activity scheduling | Adds a whole new entity (activities/tasks) unrelated to core pipeline-tracking value |
| Deal health/risk scoring as a separate feature | Deliberately merged into the single Forecast page per PROJECT.md decision — no separate scoring module |
| Authentication / multi-user / role-based permissions | Prototype is single-user and frontend-only; adds infrastructure with no payoff before a real backend exists |
| Backend/API persistence | Explicitly deferred until integration into the existing iDrive project |
| Full spreadsheet-grade inline editing (every cell, keyboard nav, copy/paste, undo) | High cost relative to value for a prototype validating the pipeline concept, not a spreadsheet clone |
| Configurable/custom pipeline stages or custom fields | Only one hardcoded pipeline and one user exist today; configurability has no payoff yet |
| AI-generated insights / natural-language forecasting assistant | Requires real historical data to be meaningful; mock data would produce meaningless output |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PIPE-01 | Phase 1 | Complete |
| PIPE-02 | Phase 1 | Complete |
| PIPE-03 | Phase 3.1 | Pending |
| PIPE-04 | Phase 4 | Pending |
| PIPE-05 | Phase 4 | Pending |
| PIPE-06 | Phase 4 | Pending |
| DEAL-01 | Phase 1 | Complete |
| DEAL-02 | Phase 2 | Complete |
| DEAL-03 | Phase 2 | Complete |
| DEAL-04 | Phase 2 | Complete |
| DEAL-05 | Phase 2 | Complete |
| DEAL-06 | Phase 3 | Complete |
| LOST-01 | Phase 3.1 | Pending |
| LOST-02 | Phase 3.1 | Pending |
| WON-01 | Phase 3.1 | Pending |
| FCST-01 | Phase 4 | Pending |
| FCST-02 | Phase 4 | Pending |

**Coverage:**

- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-28*
*Last updated: 2026-09-09 — Phase 3 redirected to deal-terms wizard (DEAL-06); PIPE-03/LOST-01/LOST-02/WON-01 moved to inserted Phase 3.1*
