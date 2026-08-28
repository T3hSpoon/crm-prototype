# Feature Research

**Domain:** CRM / sales-pipeline tools (monday.com CRM, Pipedrive, HubSpot, Zoho CRM)
**Researched:** 2026-08-28
**Confidence:** MEDIUM (cross-checked against monday.com/Pipedrive official support docs and multiple independent CRM-analytics sources; no primary UX testing performed)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in any pipeline/deal-tracking tool. Missing these makes the prototype feel broken, not just "v1."

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Grouped pipeline table (stage = group/section) | Every CRM (monday.com Deals board, Pipedrive, HubSpot) organizes deals into stage-based groups/columns; it's the primary mental model of "a pipeline" | MEDIUM | Render as collapsible groups (Prospect, Lead, Opportunity, Deal/Won, Lost) each with its own colored header and row count/subtotal — matches monday.com's group pattern referenced in PROJECT.md |
| Move a deal between stages | The core interaction of a pipeline tool; users expect either drag-drop or a stage-select dropdown per row | MEDIUM | monday.com defaults to drag-drop in its Kanban/Pipeline view but a status-column dropdown works equally well in a grouped table and is far simpler to build with mock state (no dnd library needed for v1) |
| Add a new deal/prospect | Baseline CRUD; without it the tool is a static report, not a working pipeline | LOW | Simple modal/form appending to in-memory state |
| Inline edit of deal fields | Users expect to click a cell (name, value, owner, close date) and edit without a full-page navigation — this is the monday.com "instant edit" table feel | MEDIUM | Can be scoped down to click-to-edit on key fields only for v1; full spreadsheet-style cell editing is higher effort |
| Per-deal line items / subitems (product, SKU, qty, unit price, subtotal) | Deals rarely have a single flat value — B2B/product deals are composed of multiple items; monday.com's own Deals reference board uses subitems for exactly this, and it's explicitly required by PROJECT.md | MEDIUM-HIGH | Expandable row revealing a nested mini-table; deal's displayed value should ideally be the sum of line items (or overridable) |
| Deal detail view | Users expect to open a deal and see all fields, line items, and history in one place, not just a table row | LOW-MEDIUM | Can be a side panel/drawer rather than a separate page for a prototype |
| Lost-deal tracking with a required reason | Pipedrive, HubSpot, Zoho all gate "mark as lost" behind capturing a reason — sales teams live and die by loss-reason analysis | LOW-MEDIUM | Simple: on "Mark Lost" action, require selecting/entering a reason before the deal moves to the Lost group (matches Pipedrive's UX pattern) |
| Won deals as a distinct, visible group | Every CRM pipeline shows closed-won deals separately (monday.com's "Closed Won" group) — this doubles as the "contracts made" list per PROJECT.md, no separate entity needed | LOW | Just another pipeline stage/group; no new data model required |
| Basic pipeline totals (deal count, total value per group) | Table stakes even in the simplest tools — users expect to see "$X across N deals" per stage without doing math themselves | LOW | Sum line items or deal value per group in the header row |
| Sort/filter the pipeline table (by owner, value, stage, date) | Any table-based CRM view supports at least basic sort/filter; without it a growing mock dataset becomes unusable | LOW-MEDIUM | Client-side only, trivial with mock data in state |
| Search across deals | Users expect a search box to find a deal by name/company without scrolling | LOW | Simple string filter over in-memory array |

### Differentiators (Competitive Advantage)

Features that set the product apart, or that reflect PROJECT.md's specific value proposition (a lightweight, opinionated pipeline + forecast tool, not a monday.com clone).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Forecast/analytics page with weighted pipeline value | Standard CRM dashboards compute `Σ(deal value × stage probability)` rather than a flat sum — this is the single most requested "grown-up" forecasting feature and directly matches PROJECT.md's forecast requirement | MEDIUM | Assign a default win-probability per stage (e.g. Prospect 10%, Lead 25%, Opportunity 50%, Deal 80%) and compute weighted totals; presentable as a simple bar/summary view, no need for a full BI dashboard |
| Win rate calculation from lost/won history | `won / (won + lost)` is the standard, well-understood metric; combining it with the lost-reason data already being captured makes the forecast page feel purpose-built rather than generic | LOW-MEDIUM | Pure derived calculation from mock data — no extra data model needed beyond what lost-tracking already requires |
| Lost-reason breakdown/analytics (which reasons recur, by stage) | Pipedrive explicitly surfaces "lost deals grouped by stage and by reason" in Insights — this turns a compliance checkbox (capturing a reason) into an actual insight, which is a differentiator vs. tools that only log the reason and never surface it back | LOW-MEDIUM | A simple breakdown table/chart on the forecast page: count of lost deals per reason, per stage |
| Unified "evaluation = forecast" page (per PROJECT.md decision) | Most competitors split "deal health/risk scoring" from "forecast reporting" into two features/modules; PROJECT.md deliberately merges them into one lighter-weight page — simpler to build and to explain to sales-team users | LOW | This is an explicit anti-scope-creep decision already made; treat forecast page as the single home for all pipeline analysis |
| Line-item-driven deal value (auto-rollup) | Many simple CRMs still require manually typing a deal's dollar value even when it has line items, causing drift; auto-computing deal value as the sum of its line items (with manual override) is a meaningfully better UX for product/service-based sales | MEDIUM | Requires a small computed-field pattern in the mock data layer; worth flagging as a design decision to make explicit rather than silently supporting both |
| Distinct visual identity while keeping monday.com's proven concepts (groups/table/subitems) | PROJECT.md explicitly wants "own visual design, not a clone" — differentiation here is about design quality and clarity, not new pipeline mechanics | MEDIUM | This is a design/UI-spec concern more than a features concern, but it's worth naming as the product's positioning: same proven IA, better/cleaner execution |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this milestone specifically (frontend-only prototype with mock data, no backend/auth).

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Kanban board view (in addition to table) | monday.com and Pipedrive both ship a card/Kanban pipeline view alongside the table, and it "feels more visual" | Explicitly out of scope per PROJECT.md; doubles the UI surface (drag-drop cards + grouped table) for a v1 prototype with no backend to persist state changes between views | Ship the grouped table only for v1; revisit Kanban after backend integration once state is persisted server-side |
| Calendar / activity scheduling view | CRMs like HubSpot bundle meeting/task scheduling tightly with deals | Explicitly out of scope; adds a whole new entity (activities/tasks) with its own CRUD, unrelated to the core pipeline-tracking value prop of this milestone | Defer to a future milestone once backend and possibly calendar-API integration exist |
| Deal health/risk scoring as its own feature | Competitors (monday.com's "Pipeline Health Agent") market AI-driven risk flags as a headline feature | PROJECT.md explicitly merges this into the forecast page — building a separate scoring engine/UI now is scope creep for a mock-data prototype with no real signal (no email/activity data to score against) | Fold any "at-risk" signal (e.g., stale deals, deals lingering too long in a stage) into the single forecast/analytics page as a simple flag, not a standalone module |
| Authentication / multi-user / role-based permissions | Every real CRM has login and per-user pipelines/ownership | Explicitly out of scope per PROJECT.md; this phase is single-user and frontend-only, so auth adds infrastructure with zero payoff before the backend exists | Design the data model with an `owner`/`assignedTo` field now (cheap) so multi-user filtering slots in later without a rework |
| Backend persistence / real API integration | Users (and stakeholders demoing the prototype) will eventually want data to survive a refresh | Building real persistence now duplicates work once this merges into the existing iDrive project's actual backend, and it's explicitly deferred in PROJECT.md | Structure mock data behind a thin data-access layer (hooks/functions) that mimics the shape of a future API response, so swapping in real fetch calls later is a search-and-replace, not a rewrite |
| Full spreadsheet-grade inline editing (every cell, keyboard nav, copy/paste, undo) | monday.com's table supports near-Excel-level cell editing and it looks impressive in demos | High implementation cost relative to value for a prototype whose purpose is validating the pipeline concept, not being a spreadsheet clone | Support inline edit on the handful of fields that matter (name, value, owner, stage, close date); use a modal/drawer for line items and less-frequently-edited fields |
| Custom/configurable pipeline stages or custom fields | Real CRMs (monday.com, HubSpot) let admins rename/add stages and define custom columns per board | Configurability multiplies the data model and UI complexity (schema-per-tenant) for zero payoff when there's only one hardcoded pipeline (Prospect→Lead→Opportunity→Deal) and one user | Hardcode the four stages + Lost as an enum for this milestone; revisit configurability only if/when the tool needs to serve multiple sales teams with different processes |
| AI-generated insights / natural-language forecasting assistant | Increasingly common in 2026 CRM marketing (monday.com's "Piper" agent, HubSpot AI) | Requires a real LLM integration and real historical data to be useful — mock data produces meaningless "insights" and it's a distraction from validating the core pipeline UX | Keep the forecast page to deterministic, explainable calculations (weighted pipeline, win rate, loss-reason breakdown); consider AI summarization only after real data exists |

## Feature Dependencies

```
Grouped pipeline table (stages as groups)
    └──requires──> Deal data model (stage, value, owner, close date)
                       └──requires──> Mock/seed data set

Line items per deal
    └──requires──> Deal detail view (expandable row or drawer)
    └──enhances──> Grouped pipeline table (auto-rollup deal value)

Move deal between stages
    └──requires──> Grouped pipeline table
    └──requires──> Deal data model with a mutable `stage` field

Mark deal as lost + reason
    └──requires──> Move deal between stages (Lost is just another stage transition)
    └──enhances──> Forecast/analytics page (loss-reason breakdown, win rate)

Won deals as "contracts made" list
    └──requires──> Grouped pipeline table (Won is just another group)

Forecast/analytics page
    └──requires──> Deal data model with `stage`, `value`, `probability`
    └──requires──> Lost-deal tracking (for win rate + loss-reason data)
    └──requires──> Line items (if deal value is line-item-derived, forecast math depends on the rollup)

Sort/filter/search
    └──enhances──> Grouped pipeline table (not a hard dependency, purely additive)

Kanban board view [ANTI-FEATURE, deferred]
    └──would require──> Grouped pipeline table + drag-drop library + persisted stage state
```

### Dependency Notes

- **Forecast page requires lost-deal tracking:** Win rate and loss-reason analytics are meaningless without deals actually being marked lost with a reason first — build lost-tracking before or alongside the forecast page, not after.
- **Line items enhance the pipeline table:** If deal value is derived as the sum of line items, the table's per-group totals and the forecast page's weighted-pipeline math both depend on line items being modeled correctly from the start — get the line-item data shape right early since two downstream features build on it.
- **Move-between-stages and mark-as-lost are the same mechanism:** "Lost" should be modeled as a stage/status value, not a separate boolean or entity — this keeps the pipeline table, group totals, and forecast calculations all working off one consistent `stage` field instead of two parallel state machines.
- **Kanban view (deferred) would reuse the pipeline table's data layer:** If this app is later extended with a Kanban view, keeping deal/stage state in a normalized store now (not embedded in table-only component state) avoids a rework — worth a light architectural note even though the view itself is out of scope.

## MVP Definition

### Launch With (v1)

Minimum viable product — matches PROJECT.md's Active requirements exactly.

- [ ] Grouped pipeline table with Prospect / Lead / Opportunity / Deal (Won) / Lost groups — this IS the product
- [ ] Add new prospect/deal via form — without creation, the pipeline can never grow
- [ ] Inline edit of deal fields and line items — read-only data doesn't demonstrate a working tool
- [ ] Move deal between stages — the core pipeline interaction
- [ ] Per-deal line items (product/service, SKU, units, unit price, subtotal, type) — required to show deal composition
- [ ] Mark deal as lost with a captured reason, moved to Lost group — required for loss analysis later
- [ ] Won deals shown as "contracts made" list (reuse of Won group, no new entity) — cheapest possible way to satisfy this requirement
- [ ] Forecast page: pipeline value, win rate, projected/weighted revenue — the differentiator that makes this more than a static table
- [ ] Group-level totals (deal count + value) on the pipeline table — near-zero cost, high perceived polish
- [ ] Basic search/filter on the pipeline table — needed once mock data has more than ~10 rows to stay demoable

### Add After Validation (v1.x)

Features to add once the core pipeline + forecast concept is validated with stakeholders.

- [ ] Loss-reason breakdown chart/table on the forecast page — trigger: once enough mock "lost" deals exist to make a breakdown meaningful
- [ ] Sort by column (value, close date, owner) — trigger: user feedback that the default order isn't useful during demos
- [ ] Deal detail drawer/panel (vs. inline-only editing) — trigger: line items or notes become too cramped for inline table editing
- [ ] Stalled-deal flag (deal sitting in a stage too long) — trigger: forecast page feels too "flat"/summary-only and needs one qualitative signal

### Future Consideration (v2+)

Features to defer until this integrates with the real iDrive backend/project.

- [ ] Backend/API persistence — deferred until merge into the existing iDrive project
- [ ] Authentication / multi-user pipelines with ownership filtering — deferred, single-user for now
- [ ] Kanban board view — explicitly deferred per PROJECT.md
- [ ] Calendar/activity scheduling — explicitly deferred per PROJECT.md
- [ ] Configurable/custom pipeline stages — defer until multiple sales processes actually need to coexist
- [ ] AI-driven insights or pipeline-health agent — defer until real historical data exists to make it meaningful

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Grouped pipeline table (stages) | HIGH | MEDIUM | P1 |
| Add deal via form | HIGH | LOW | P1 |
| Move deal between stages | HIGH | MEDIUM | P1 |
| Per-deal line items | HIGH | MEDIUM-HIGH | P1 |
| Mark deal lost + reason | HIGH | LOW-MEDIUM | P1 |
| Won deals as contracts list | HIGH | LOW | P1 |
| Forecast page (weighted value, win rate) | HIGH | MEDIUM | P1 |
| Group-level totals | MEDIUM | LOW | P1 |
| Inline field editing | MEDIUM | MEDIUM | P1 |
| Search/filter pipeline table | MEDIUM | LOW-MEDIUM | P2 |
| Loss-reason breakdown analytics | MEDIUM | LOW-MEDIUM | P2 |
| Sort by column | LOW-MEDIUM | LOW | P2 |
| Deal detail drawer/panel | MEDIUM | MEDIUM | P2 |
| Stalled-deal flag | LOW-MEDIUM | LOW-MEDIUM | P3 |
| Kanban board view | MEDIUM | HIGH | P3 (deferred per scope) |
| Calendar/activities | LOW (for this milestone) | HIGH | P3 (deferred per scope) |
| Configurable stages/custom fields | LOW (single pipeline today) | HIGH | P3 (deferred) |
| AI insights/health agent | LOW (no real data yet) | HIGH | P3 (deferred) |

**Priority key:**
- P1: Must have for launch (matches PROJECT.md Active requirements)
- P2: Should have, add when possible
- P3: Nice to have or explicitly deferred per PROJECT.md Out of Scope

## Competitor Feature Analysis

| Feature | monday.com CRM | Pipedrive | HubSpot | Our Approach |
|---------|-----------------|-----------|---------|--------------|
| Pipeline stages/groups | Board groups (e.g., Active Deals, Closed Won) with colored headers; Kanban + table views | Stage-based pipeline, Kanban-first with a list/table alternative | Deal stages in a Kanban board, table view available in "Deals" list | Grouped table only (no Kanban) with Prospect/Lead/Opportunity/Deal(Won)/Lost groups — table-first per PROJECT.md scope |
| Line items per deal | Subitems (paid-plan gated) for product/qty/price detail | Native "Products" attached to a deal with qty/price | Native line items tied to a product library | Per-deal line items (product/service, SKU, units, unit price, subtotal, type) always available — no plan-gating since this is a single-tenant prototype |
| Lost-deal reason | Supported via status/automation, less prescriptive than Pipedrive | Required reason (freeform or predefined list) captured when marking lost; surfaced in Insights by stage/reason | Requires a "closed lost" reason property, customizable picklist | Required reason field on "Mark Lost," deal moves to a Lost group, reasons feed the forecast page's loss breakdown |
| Won deals / contracts | Separate "Closed Won" group | Won deals filterable/reportable separately | Deals marked Closed Won, often synced to a "customers" list | Won group doubles directly as the "contracts made so far" view — no separate contract entity, per PROJECT.md decision |
| Forecast/analytics | Dashboard widgets + AI "Pipeline Health Agent" for coverage/velocity/risk | Insights module with weighted pipeline, forecast reports, win-rate reporting | Forecast tool with weighted/manual forecast categories, deal probability by stage | One combined forecast page: weighted pipeline value (value × stage probability), win rate, loss-reason breakdown — no separate "health" module, per PROJECT.md's explicit merge decision |

## Sources

- [Sales CRM Features + AI | monday CRM](https://monday.com/crm/features) — MEDIUM confidence (vendor page, cross-checked against support docs)
- [Sales pipeline management with monday CRM – Support](https://support.monday.com/hc/en-us/articles/360013348719-Sales-pipeline-management-with-monday-CRM) — MEDIUM confidence (official support doc)
- [Monday CRM Deals Board: Pros, Cons, and How to Make It Work in 2025](https://mondaywiki.com/monday-crm-deals-board/) — LOW-MEDIUM confidence (third-party, used only to corroborate groups/subitems structure)
- [How to Create Subitems in Monday CRM for Complex Deals • AeroLeads](https://aeroleads.com/blog/create-subitems-monday-crm-complex-deals/) — LOW-MEDIUM confidence (third-party tutorial)
- [Lost reasons - Knowledge Base | Pipedrive](https://support.pipedrive.com/en/article/lost-reasons) — MEDIUM confidence (official support doc)
- [How can I enable predefined lost reasons? - Knowledge Base | Pipedrive](https://support.pipedrive.com/en/article/how-can-i-enable-predefined-lost-reasons) — MEDIUM confidence (official support doc)
- [Pipedrive CRM Deals Lost by Reason - Metric Definition - Metric Library](https://databox.com/metric-library/metrics/pipedrive/deals-lost-by-reason) — LOW-MEDIUM confidence (third-party analytics vendor, corroborating)
- [How to Build and Track Weighted Sales Pipeline? - Coefficient](https://coefficient.io/sales-pipeline-2/how-to-build-and-track-weighted-sales-pipeline) — MEDIUM confidence (cross-checked against multiple independent sources converging on the same formula)
- [Weighted Sales Pipeline | Sales Glossary | SalesHive](https://saleshive.com/glossary/weighted-sales-pipeline/) — LOW-MEDIUM confidence (corroborating glossary definition)
- [CRM Reporting Guide: Key Metrics, Dashboards, and Sales Forecasting](https://mriacrm.com/crm-reporting-guide-key-metrics-dashboards-and-sales-forecasting/) — LOW-MEDIUM confidence (corroborating on win-rate formula and dashboard metrics)
- PROJECT.md requirements and Key Decisions (`c:/gh-repos/eld/.planning/PROJECT.md`) — HIGH confidence (primary source, authoritative for scope)

---
*Feature research for: CRM / sales-pipeline tool (frontend prototype)*
*Researched: 2026-08-28*
