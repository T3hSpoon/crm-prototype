# Roadmap: iDrive CRM Prototype

## Overview

This roadmap delivers a frontend-only, mock-data CRM sales pipeline in four vertical slices. Phase 1 stands up the grouped pipeline table (Prospect → Lead → Opportunity → Deal/Won → Lost) on a swap-ready data layer, lets users add deals, and lets them move deals between stages. Phase 2 deepens deal management with a detail drawer, inline field editing, and line-item composition with auto-rollup value. Phase 3 adds the explicit lost-deal flow (required reason) and formalizes the Won group as the "contracts made" list. Phase 4 completes the prototype with search/filter/sort across the pipeline table and a forecast page that turns the now-complete deal, line-item, and lost/won data into raw pipeline value, weighted/projected value, win rate, and a loss-reason breakdown.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Pipeline Board Foundation** - Grouped pipeline table with mock data, add-deal form, and stage-to-stage moves (completed 2026-09-07)
- [ ] **Phase 2: Deal Detail & Line Items** - Full deal detail view with inline editing and line-item-driven value rollup
- [ ] **Phase 3: Lost & Won Tracking** - Explicit lost-deal flow with required reason, plus Won deals as the contracts list
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

**Plans:** 2/2 plans executed

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Deal detail drawer + inline core-field editing (DEAL-02, DEAL-03)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Line items CRUD + value rollup/override (DEAL-04, DEAL-05)

**UI hint**: yes

### Phase 3: Lost & Won Tracking

**Goal**: Users can track deals that fell through with a reason, and see won deals as their running contract list
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: LOST-01, LOST-02, PIPE-03
**Success Criteria** (what must be TRUE):

  1. User can mark a deal as lost, and the action is blocked until a reason is selected or entered
  2. Marking a deal lost moves it into a distinct Lost group, separate from the active pipeline stages
  3. Won deals appear in a group that functions as the "contracts made so far" list

**Plans**: TBD
**UI hint**: yes

### Phase 4: Forecast & Pipeline Analysis

**Goal**: Users can search, filter, and sort the pipeline table, and analyze it via a forecast page
**Mode:** mvp
**Depends on**: Phase 1, Phase 2, Phase 3
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
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Pipeline Board Foundation | 4/4 | Complete    | 2026-09-07 |
| 2. Deal Detail & Line Items | 2/2 | In Progress|  |
| 3. Lost & Won Tracking | 0/TBD | Not started | - |
| 4. Forecast & Pipeline Analysis | 0/TBD | Not started | - |
