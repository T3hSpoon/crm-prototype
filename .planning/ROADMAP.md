# Roadmap: iDrive CRM Prototype

## Overview

This roadmap delivers a frontend-only, mock-data CRM sales pipeline in five vertical slices. Phase 1 stands up the grouped pipeline table (Prospect → Lead → Opportunity → Deal/Won → Lost) on a swap-ready data layer, lets users add deals, and lets them move deals between stages. Phase 2 deepens deal management with a detail drawer, inline field editing, and line-item composition with auto-rollup value. Phase 3 turns Add Deal into a 2-step wizard that captures deal-terms/contract fields (Prorata, Grace Period, Contract Term, Frequency, Currency) for every new deal at creation. Phase 3.1 (inserted) adds the explicit lost-deal flow (required reason), a Won-triggered contract-terms form, and formalizes the Won group as the "contracts made" list. Phase 4 completes the prototype with search/filter/sort across the pipeline table and a forecast page that turns the now-complete deal, line-item, and lost/won data into raw pipeline value, weighted/projected value, win rate, and a loss-reason breakdown.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Pipeline Board Foundation** - Grouped pipeline table with mock data, add-deal form, and stage-to-stage moves (completed 2026-09-07)
- [x] **Phase 2: Deal Detail & Line Items** - Full deal detail view with inline editing and line-item-driven value rollup (completed 2026-09-09)
- [ ] **Phase 3: Deal Terms Wizard** - 2-step Add Deal wizard capturing deal-terms/contract fields for every new deal at creation
- [ ] **Phase 3.1: Lost & Won Tracking (INSERTED)** - Explicit lost-deal flow with required reason, plus a contract terms form on Won and Won deals as the contracts list
- [ ] **Phase 4: Forecast & Pipeline Analysis** - Search/filter/sort plus a forecast page with weighted pipeline value and win rate

## Phase Details

### Phase 1: Pipeline Board Foundation

**Goal**: Users can view the sales pipeline as a grouped table and manage deals moving through it
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: PIPE-01, PIPE-02, DEAL-01
**Success Criteria** (what must be TRUE):

  1. User can view all deals grouped into pipeline stage sections (Prospect, Lead, Opportunity, Deal/Won, Lost), populated from mock seed data
  2. User can add a new prospect/deal via a form and see it appear immediately in the correct stage group
  3. User can move a deal from one pipeline stage to another and see it relocate to the new group

**Plans:** 4/4 plans complete

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Node.js version fix, package-legitimacy gate, Vite/React/TS scaffold + Tailwind v4/shadcn/ui

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Deal data contracts, mock repository, Zustand store, tracer render (end-to-end data seam)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Grouped pipeline board UI (5 stage sections) — PIPE-01

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-04-PLAN.md — Add Deal modal form + per-row stage-move control — DEAL-01, PIPE-02

**UI hint**: yes

### Phase 2: Deal Detail & Line Items

**Goal**: Users can manage a deal's full details, including its product/service line-item composition
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: DEAL-02, DEAL-03, DEAL-04, DEAL-05
**Success Criteria** (what must be TRUE):

  1. User can open a deal detail drawer/panel to view its full information
  2. User can edit a deal's core fields inline (name, value, owner, close date) without leaving the pipeline view
  3. User can add, edit, and remove line items on a deal (product/service, SKU, units, unit price, subtotal, type)
  4. A deal's total value defaults to the sum of its line items, with the option to manually override it

**Plans:** 2/2 plans complete

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Deal detail drawer + inline core-field editing (DEAL-02, DEAL-03)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Line items CRUD + value rollup/override (DEAL-04, DEAL-05)

**UI hint**: yes

### Phase 3: Deal Terms Wizard

**Goal**: Users can capture deal-terms/contract fields (Prorata, Grace Period, Contract Term, Frequency, Currency) for every new deal via a 2-step Add Deal wizard, required at creation regardless of pipeline stage
**Mode:** mvp
**Depends on**: Phase 1, Phase 2
**Requirements**: DEAL-06
**Success Criteria** (what must be TRUE):

  1. Clicking "Next" on the Add Deal modal's first step advances to a second step, with step-1 values preserved
  2. Step 2 captures Prorata (yes/no), Grace Period (days), Contract Term (months), Frequency (Monthly/Quarterly/Quadrimestral/Semi-Annual/Annually), and Currency (USD/EUR/GBP)
  3. "Back" returns from step 2 to step 1 without losing entered values; "Cancel" closes the wizard entirely from either step
  4. All 5 deal-terms fields are required — the wizard cannot be submitted until every field is completed
  5. Submitting step 2 creates the deal with all captured fields, appearing in whichever pipeline stage/group was selected on step 1 (not gated to Won)

**Plans:** 1 plan

Plans:
**Wave 1**

- [ ] 03-01-PLAN.md — 2-step Add Deal wizard: types, schema, dialog, repository, seed data + spec-fidelity polish (DEAL-06)

**UI hint**: yes

### Phase 3.1: Lost & Won Tracking (INSERTED)

**Goal:** Users can track deals that fell through with a reason, and capture contract terms when marking a deal as won, with won deals rolling up into a running contract list
**Mode:** mvp
**Depends on:** Phase 1, Phase 2
**Requirements**: LOST-01, LOST-02, PIPE-03, WON-01
**Success Criteria** (what must be TRUE):

  1. User can mark a deal as lost, and the action is blocked until a reason is selected or entered
  2. Marking a deal lost moves it into a distinct Lost group, separate from the active pipeline stages
  3. Marking a deal as Won and clicking Next (instead of Save) replaces the modal's content in place with a contract terms form, rather than closing the modal
  4. The contract terms form captures contract start date, contract end date/term length, signed date, payment terms (e.g. billing frequency/net terms), and final contract value
  5. Submitting the contract terms form completes the Won transition — the deal appears in a group that functions as the "contracts made so far" list, with its captured terms attached

**Plans**: TBD
**UI hint**: yes

### Phase 4: Forecast & Pipeline Analysis

**Goal**: Users can search, filter, and sort the pipeline table, and analyze it via a forecast page
**Mode:** mvp
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 3.1
**Requirements**: PIPE-04, PIPE-05, PIPE-06, FCST-01, FCST-02
**Success Criteria** (what must be TRUE):

  1. User can search deals by name/company and see the pipeline table filtered instantly
  2. User can filter the pipeline table by owner, value, stage, or close date
  3. User can sort the pipeline table by column (value, close date, owner)
  4. User can view a forecast page showing raw pipeline value, weighted/projected value, and win rate
  5. User can view a breakdown of lost deals by reason and by stage on the forecast page

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in order: 1 → 2 → 3 → 3.1 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Pipeline Board Foundation | 4/4 | Complete    | 2026-09-07 |
| 2. Deal Detail & Line Items | 2/2 | Complete    | 2026-09-09 |
| 3. Deal Terms Wizard | 0/1 | Not started | - |
| 3.1. Lost & Won Tracking (INSERTED) | 0/TBD | Not started | - |
| 4. Forecast & Pipeline Analysis | 0/TBD | Not started | - |
