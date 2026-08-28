# iDrive CRM Prototype

## What This Is

A React frontend prototype of a CRM for iDrive's sales pipeline, inspired by monday.com's board/table UI but with its own visual identity. It tracks prospects as they move through Prospect → Lead → Opportunity → Deal, keeps a record of deals that fell through (with a reason), lists closed/won deals as contracts made, and provides a forecast page for pipeline analysis. This phase is frontend-only, running on mock/seed data — no backend, API, or authentication yet.

## Core Value

A working, demoable pipeline view — prospects flow through stages, lost deals are tracked with reasons, and won deals roll up as the contract list — solid enough to later wire into iDrive's existing project without a rebuild.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Grouped table view with pipeline stage groups: Prospect, Lead, Opportunity, Deal (Won), Lost
- [ ] User can add a new prospect/deal via a form
- [ ] User can edit deal details inline (fields and line items)
- [ ] User can move a deal between pipeline stages
- [ ] Each deal supports line items (subitems): product/service, SKU, units, unit price, subtotal, type
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
| Pipeline order: Prospect → Lead → Opportunity → Deal | Standard sales funnel progression, confirmed by user over the initially-stated order | — Pending |
| Mock/seed data only, no persistence | Backend/API is explicitly deferred to post-integration work | — Pending |
| Own visual design, monday.com concepts only | Avoid a close visual clone; reuse pipeline/groups/subitems concepts | — Pending |
| React as frontend stack | Improves odds of a clean merge into the existing iDrive project later | — Pending |
| Line items (subitems) per deal | Needed to capture product/service composition, mirroring the monday.com reference | — Pending |
| Lost deals tracked in a separate group with a reason field | User wants to see what fell through and why | — Pending |
| Won deals double as the "contracts made" list | No separate contract entity needed — a closed-won deal is the contract | — Pending |
| Forecast page included in v1 | User wants evaluation/forecast analysis available now, not deferred to v2 | — Pending |
| No authentication in prototype | Single-user scope for this phase | — Pending |

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
*Last updated: 2026-08-28 after initialization*
