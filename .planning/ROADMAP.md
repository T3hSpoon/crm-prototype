# Roadmap: iDrive CRM Prototype

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (incl. 3.1) (shipped 2026-09-15)
- ✅ **v1.1 Confidence-Based Forecast Breakdown** — Phase 5 (shipped 2026-09-16)
- 🚧 **v1.2 Sales Dashboard** — Phase 6 (in progress)

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>✅ v1.0 MVP (Phases 1-4, incl. 3.1) — SHIPPED 2026-09-15</summary>

- [x] Phase 1: Pipeline Board Foundation (4/4 plans) — completed 2026-09-07
- [x] Phase 2: Deal Detail & Line Items (2/2 plans) — completed 2026-09-09
- [x] Phase 3: Deal Terms Wizard (1/1 plan) — completed 2026-09-09
- [x] Phase 3.1: Lost & Won Tracking (INSERTED) (2/2 plans) — completed 2026-09-14
- [x] Phase 4: Forecast & Pipeline Analysis (2/2 plans) — completed 2026-09-15

Full details: [.planning/milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v1.1 Confidence-Based Forecast Breakdown (Phase 5) — SHIPPED 2026-09-16</summary>

- [x] Phase 5: Confidence-Based Forecast Breakdown (1/1 plans) — completed 2026-09-16

Full details: [.planning/milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md)

</details>

### 🚧 v1.2 Sales Dashboard (In Progress)

**Milestone Goal:** Add a new Dashboard page (alongside Pipeline and Forecast) giving a sales-management view of the pipeline — targets, leaderboard, conversion funnel, and closed-deal breakdown — inspired by a monday.com sales dashboard reference but adapted to our existing data model.

- [x] **Phase 6: Sales Dashboard** - New Dashboard tab with a unit-sales-target gauge, target-vs-actual chart, owner leaderboard, stage conversion funnel, and closed-deals-by-owner stacked bar (completed 2026-09-18)

## Phase Details

### Phase 6: Sales Dashboard

**Goal**: Sales managers can open a new Dashboard tab and see, at a glance, how the pipeline is performing against target — unit attainment, owner ranking, stage-conversion health, and closed-deal volume over time — all derived from existing deal data with no new backend or persistence.
**Depends on**: Phase 5
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):

  1. User can open a "Dashboard" tab alongside the existing Pipeline and Forecast tabs and see a Unit Sales Target gauge showing actual units (summed line-item quantities across Won deals) against a seeded mock target
  2. User can view a Target vs. Actual Sales chart plotting Won-deal unit volume by close date against the target, across the full closed-deal history
  3. User can view a Leaderboard ranking owners by their total Won deal value
  4. User can view a Conversion Rate funnel showing stage-by-stage percentages across Prospect → Lead → Opportunity → Deal → Won
  5. User can view a stacked bar chart of deals closed per time period, with each bar segmented by owner

**Plans**: 3/3 plans executed
**Wave 1**

- [x] 06-01-PLAN.md — Seed-data foundation (D-01/02/04/05/06) + Unit Sales Target gauge (DASH-01)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 06-02-PLAN.md — Target vs. Actual Sales chart + Owner Leaderboard (DASH-02, DASH-03)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 06-03-PLAN.md — Conversion Rate funnel + Closed-by-Owner stacked bar (DASH-04, DASH-05)

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in order: 1 → 2 → 3 → 3.1 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Pipeline Board Foundation | 4/4 | Complete | 2026-09-07 |
| 2. Deal Detail & Line Items | 2/2 | Complete | 2026-09-09 |
| 3. Deal Terms Wizard | 1/1 | Complete | 2026-09-09 |
| 3.1. Lost & Won Tracking (INSERTED) | 2/2 | Complete | 2026-09-14 |
| 4. Forecast & Pipeline Analysis | 2/2 | Complete | 2026-09-15 |
| 5. Confidence-Based Forecast Breakdown | 1/1 | Complete | 2026-09-16 |
| 6. Sales Dashboard | 3/3 | Complete    | 2026-09-18 |
