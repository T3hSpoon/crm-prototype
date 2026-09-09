# iDrive CRM Prototype

## What This Is

A React frontend prototype of a CRM for iDrive's sales pipeline, inspired by monday.com's board/table UI but with its own visual identity. It tracks prospects as they move through Prospect → Lead → Opportunity → Deal, keeps a record of deals that fell through (with a reason), lists closed/won deals as contracts made, and provides a forecast page for pipeline analysis. This phase is frontend-only, running on mock/seed data — no backend, API, or authentication yet.

## Core Value

A working, demoable pipeline view — prospects flow through stages, lost deals are tracked with reasons, and won deals roll up as the contract list — solid enough to later wire into iDrive's existing project without a rebuild.

## Requirements

### Validated

- ✓ Grouped table view with pipeline stage groups: Prospect, Lead, Opportunity, Deal (Won), Lost — Phase 1
- ✓ User can add a new prospect/deal via a form — Phase 1
- ✓ User can move a deal between pipeline stages — Phase 1
- ✓ User can edit deal details inline (fields and line items) — Phase 2
- ✓ Each deal supports line items (subitems): product/service, SKU, units, unit price, subtotal, type — Phase 2
- ✓ User can capture deal-terms/contract fields (Prorata, Grace Period, Contract Term, Frequency, Currency) via a 2-step Add Deal wizard, for every new deal at creation — Phase 3

### Active

- [ ] User can mark a deal as lost, capture a reason, and it moves to a separate Lost group
- [ ] Won deals are listed as the "contracts made so far" view (no separate contract entity)
- [ ] Forecast page showing pipeline value, win rate, and projected revenue, derived from mock data
- [ ] All data is mock/seed data held in app state — no persistence layer yet

### Out of Scope

- Backend/API integration — deferred; forms will eventually POST to a database, but this phase stays frontend-only until merged into the existing iDrive project
- Authentication / multi-user — prototype is single-user, no login screen
- Kanban board and calendar views — table view only for v1
- Deal health/risk scoring as a distinct feature — "evaluations" and "forecasts" are treated as the same analysis feature, not two
- Close visual clone of monday.com — building the same concepts (groups, table, subitems) with a distinct design, not pixel-matching the screenshot

## Context

- Reference screenshot: monday.com's "Deals" board (IdriveAI CRM workspace) — grouped table with colored status groups, subitems for inventory line items (SKU, units, price, product/service type), and a Nexus integration status column. Used for concept inspiration only, not a visual target.
- The user has an existing iDrive project this CRM is ultimately meant to integrate into (adding real API/database wiring). That project's code is not yet present in this repository — integration is explicitly future work, not part of this milestone.
- React was chosen as the stack partly to align with the likely stack of that existing project, reducing future rework when integration happens.

## Constraints

- **Scope**: Frontend only — no API calls, no database, no auth in this phase
- **Data**: Mock/seed data held in-app — no persistence layer; structured so it's easy to swap for a real API later
- **Tech stack**: React — chosen for likely compatibility with the existing iDrive project this will eventually integrate into

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pipeline order: Prospect → Lead → Opportunity → Deal | Standard sales funnel progression, confirmed by user over the initially-stated order | Shipped Phase 1 — `PipelineStage` type + 5 fixed board groups (Lost derived, not a stage) |
| Mock/seed data only, no persistence | Backend/API is explicitly deferred to post-integration work | Shipped Phase 1 — `DealsRepository` interface + `MockDealsRepository`, swap-ready seam, zero network calls |
| Own visual design, monday.com concepts only | Avoid a close visual clone; reuse pipeline/groups/subitems concepts | Shipped Phase 1 — tinted cards, left accent bars, per-group icons, original 5-hue palette; human-confirmed distinct in UAT |
| React as frontend stack | Improves odds of a clean merge into the existing iDrive project later | Shipped Phase 1 — Vite 8 + React 19.2 + TypeScript 5.9.3, builds and runs cleanly |
| Line items (subitems) per deal | Needed to capture product/service composition, mirroring the monday.com reference | Shipped Phase 2 — `LineItemsTable` (add/edit/remove), value auto-tracks the sum via `sumLineItems`/`hasManualOverride` with a manual-override + reset-to-sum path, positive-value validation on units/unitPrice |
| Lost deals tracked in a separate group with a reason field | User wants to see what fell through and why | Partially shipped Phase 1 — Lost is a live board group; the required-reason gate is deferred to Phase 3.1 by design |
| Won deals double as the "contracts made" list | No separate contract entity needed — a closed-won deal is the contract | — Pending (Phase 3.1) |
| Deal-terms/contract fields (Prorata, Grace Period, Contract Term, Frequency, Currency) captured on every new deal, at creation | User wants this data captured up front for later contract/quote template generation, regardless of pipeline stage | Shipped Phase 3 — `AddDealDialog` converted to a 2-step wizard (step 1 unchanged; step 2 adds all 5 fields via `addDealStep2Schema`, required with sane numeric bounds); accepted risk that un-touched step-2 defaults are indistinguishable from deliberately-entered values, confirmed acceptable for this phase's scope by the user at UAT (`03-SECURITY.md` AR-03-01) |
| Forecast page included in v1 | User wants evaluation/forecast analysis available now, not deferred to v2 | — Pending (Phase 4) |
| No authentication in prototype | Single-user scope for this phase | Confirmed Phase 1 — no auth code exists anywhere in the codebase |
| TypeScript pinned to 5.9.3, not 7.0.2 | `typescript-eslint@8.68.0`'s peer range (`<6.1.0`) is incompatible with TS 7's native compiler | Shipped Phase 1 |
| Stage moves via a per-row dropdown, not drag-and-drop, in Phase 1 | Ship the simpler mechanism first; `@dnd-kit` packages are installed but reserved for a same-`moveStage`-action Phase 2+ fast-follow | Shipped Phase 1 |
| Deal detail interaction model: chevron-expandable sub-row, not a drawer | User-directed pivot after Phase 2's initial execution — inline table editing already covered all 4 core fields, leaving line items as the drawer's only unique job, so it moved to a chevron-toggle sub-row (closer to the tech stack's originally-recommended `getSubRows`-style pattern); the drawer (`DealDetailDrawer.tsx`, `sheet.tsx`) was removed entirely | Shipped Phase 2 (quick task 260908-f9d) |
| Pipeline board widened to ~95% of viewport width | User wants more horizontal room now that rows carry a chevron + ID column alongside the original 5 fields | Shipped Phase 2 (quick task 260908-f9d) |
| Deal IDs display as 10-digit numeric strings, not UUIDs | User-requested display/format preference; a "Deal ID" column was also added as the last table column | Shipped Phase 2 (quick tasks 260908-i18, 260908-i6f) |
| Standalone Vercel deployment for demo purposes | User wants to showcase the prototype before the eventual merge into the existing iDrive project | Shipped Phase 2 (quick task 260909-dig, `vercel.json`) — live at https://eld-dusky.vercel.app |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-09 after Phase 3*
