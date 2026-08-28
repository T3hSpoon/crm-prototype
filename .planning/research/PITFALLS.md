# Pitfalls Research

**Domain:** CRM sales-pipeline UI (React, grouped/table view with subitems, mock-data-first prototype meant for later API integration)
**Researched:** 2026-08-28
**Confidence:** MEDIUM-HIGH (synthesized from CRM domain post-mortems, React data-grid engineering pitfalls, and frontend-prototype-to-production integration patterns; no single source addresses this exact combination, so specifics are triangulated and adapted)

## Critical Pitfalls

### Pitfall 1: Mock data shaped like UI state, not like a future API resource

**What goes wrong:**
The mock data model gets built to match what's convenient for rendering the table right now (e.g., a flat array with denormalized stage names as strings, line items inlined as a raw array with no IDs, computed fields like `subtotal` or `stageLabel` stored instead of derived). When the real API/database arrives, every component that reads these shapes has to be rewritten because the DB-backed shape (normalized entities, foreign keys, server-computed aggregates, pagination envelopes) doesn't match.

**Why it happens:**
When there's no real backend to conform to, it's fastest to shape mock data exactly like the component needs it for rendering — nobody is forcing a contract. This is the single most cited failure mode in "mock-first, integrate-later" frontend work: the mock and the real API drift immediately because nothing keeps them honest.

**How to avoid:**
- Write down (even informally, in a `types.ts`/`schema` file) the resource shapes you'd expect a REST/GraphQL API to return for Deals, Line Items, Stages, and Lost Reasons — as if the backend already existed — *before* writing the mock generator.
- Give every entity a stable `id` (string, not array index) — deals, line items, and stage/group definitions all need IDs so future API integration can key off them instead of position.
- Never store a derived value in the mock data itself if it can be computed from source fields (see Pitfall 4 — same root cause, applies to line-item subtotal, deal total, weighted forecast value).
- Keep the mock data access behind a thin data-access layer (functions like `getDeals()`, `updateDealStage()`, `addLineItem()`) rather than components reading/mutating a shared array directly. This is the seam where a real `fetch()` call will later replace an in-memory operation — if components call these functions today, only the functions change later, not every component.
- Model stage as an enum/identifier (`"lead"`, `"opportunity"`), not a display label — labels are presentation, identifiers are data.

**Warning signs:**
- Components reading raw mock array fields directly (`deal.subtotal`) instead of through a selector/hook.
- No `id` field on line items or deals — they're addressed by array index.
- Mock data generator and component prop types defined in the same file with no separation.
- "Contract" fields (won deals) reuse deal fields ad hoc rather than being a documented view over the Deal shape.

**Phase to address:**
Data-model/foundation phase (before or alongside the first table UI phase) — this is the highest-leverage phase to get right since every later phase builds on top of the shape decided here.

---

### Pitfall 2: Deep, uncontrolled nesting for line items inside a grouped table

**What goes wrong:**
Line items (subitems) get modeled and rendered as an arbitrarily deep tree, or as fully independent rows visually indistinguishable from parent deals, causing edit/selection logic, drag-to-reorder, and stage-move logic to become combinatorial (does moving a deal move its line items? can a line item be "lost" independently? what happens to expand/collapse state when a deal moves groups?). monday.com itself constrains subitems to a single level for exactly this reason — deeper nesting multiplies UI and state complexity disproportionately to value.

**Why it happens:**
The reference screenshot (monday.com Deals board) makes nested subitems look simple, but the visual simplicity hides that monday.com subitems are a genuinely separate, second board under the hood, not a tree data structure — a distinction easy to miss when re-implementing "the same feature" from a screenshot.

**How to avoid:**
- Explicitly cap nesting at one level: Deal → Line Items. No line-item-of-a-line-item.
- Model line items as a plain array on the deal (`deal.lineItems: LineItem[]`), not as a self-referential tree.
- Decide up front, in writing, what happens to line items when a deal changes stage (they move with the deal, always — a line item cannot outlive or be independently staged) and when a deal is marked lost (line items are retained for the record, not deleted).
- Keep expand/collapse UI state (which deals are expanded) separate from the data model — it's ephemeral UI state, not something that belongs in the deal record, and should not survive a mock-to-API swap unchanged.
- Compute deal-level rollups (total value = sum of line-item subtotals) at render/selector time, not stored redundantly on the deal (ties to Pitfall 4).

**Warning signs:**
- Line item type definition allows a `children` or `subItems` field on itself.
- Expand/collapse state stored inside the mock data records instead of local component/UI state.
- Any logic that has to ask "is this row a deal or a line item?" via type-sniffing rather than an explicit discriminator.

**Phase to address:**
Table/grouped-view UI phase, in tandem with the data-model phase. Should be locked down before inline-editing and stage-drag interactions are built on top of it.

---

### Pitfall 3: Stage-transition and lost-deal logic modeled as "just another field edit"

**What goes wrong:**
Moving a deal between stages (Prospect → Lead → Opportunity → Deal) and marking a deal Lost get implemented as generic "update this field" operations (e.g., a dropdown that sets `deal.stage = 'lost'`), with no distinct transition step. This causes: lost deals losing their stage history (can't tell what stage a deal was in when it was lost, which is valuable for the forecast/analytics view and for the "why do deals from stage X fail" analysis); no enforced requirement to capture a reason when marking lost (reason becomes optional/skippable in practice even though the requirement calls for capturing it); and no distinction between a deal moving forward in the normal funnel vs. being pulled out of it entirely (won/lost are terminal states, not funnel stages, and mixing them into the same "stage" field breaks assumptions later, e.g., "average time in Opportunity stage" calculations that will accidentally include lost/won as if they were mid-funnel).

**Why it happens:**
It's the path of least resistance in a mock-data prototype: one `stage` field, one setter, done. The cost only shows up later, when someone tries to build the forecast view (Pitfall 5) or when lost-deal analysis needs the reason to be reliably present and the pre-loss stage to be known.

**How to avoid:**
- Model status as two concerns: `pipelineStage` (Prospect/Lead/Opportunity/Deal — the funnel position) and `outcome` (open/won/lost), not one flat `stage` enum that conflates funnel position with terminal state. A lost deal should retain the `pipelineStage` it was lost from.
- Make "mark as lost" its own explicit action/function (`markDealLost(dealId, reason)`) that requires a reason as a parameter — not a side effect reachable by editing a stage dropdown without a reason prompt. If the UI allows dragging a deal into a "Lost" group, that drag interaction should trigger a required reason-capture step (e.g., a modal), it should not silently set a field.
- Use a finite, predefined list of lost reasons (not a freeform text-only field) per the domain research on lost-deal tracking — freeform-only reason fields become unusable for later aggregate reporting ("what % of losses are price-related?"). A reason code + optional freeform note is the pattern that scales into real reporting later.
- Record a timestamp/history entry for stage transitions (at minimum: when the deal entered its current stage, when it was lost/won) even in mock data — this is cheap now and expensive to backfill later once real usage data exists, and it directly feeds the forecast page.
- Treat "Won" the same way as "Lost": an explicit terminal-state transition, not a stage value that could theoretically be reverted to like any other stage.

**Warning signs:**
- A single `stage` field whose possible values include both funnel stages and "Lost"/"Won".
- "Mark as lost" implemented as a plain dropdown option with the reason field editable/skippable afterward rather than required at the moment of transition.
- No stored transition history/timestamps — only current state.
- Reason for loss is a single unconstrained text input with no canonical category.

**Phase to address:**
Stage-transition / lost-deal-handling phase (distinct from basic CRUD/table phase) — should come after the base table view works but before the forecast page, since forecast depends on this data being structured correctly.

---

### Pitfall 4: Forecast/analytics values computed as vanity aggregates instead of calibrated metrics

**What goes wrong:**
The forecast page sums raw pipeline value ("$X in the pipeline") and presents it as if it were a revenue projection, or computes "win rate" as a naive count of won-vs-total without weighting by deal value or excluding still-open deals from the denominator. This produces numbers that look impressive/plausible in a demo but are calculation-wise meaningless, and — worse for a prototype meant to be trusted later — establishes formulas that get carried forward into the real product once wired to live data, at which point they're much harder to change because stakeholders have anchored on them.

**Why it happens:**
Raw sums and simple ratios are the easiest thing to compute from mock data and "look like" a forecast in a demo. The distinction between "pipeline value" (sum of all open deal values — a vanity number) and "weighted/forecast value" (pipeline value adjusted by stage-probability or historical conversion rate) is a well-documented, extremely common real-world CRM forecasting mistake — companies routinely miss forecasts by large margins because they forecast off raw pipeline instead of a calibrated, weighted figure.

**How to avoid:**
- Explicitly separate three distinct numbers on the forecast page and label them distinctly: (1) **Pipeline value** = sum of all open (non-won, non-lost) deal values — a snapshot, not a forecast; (2) **Weighted/projected revenue** = sum of (deal value × stage probability), where stage probability is an explicit, documented, per-stage constant (even a rough placeholder like Prospect=10%, Lead=25%, Opportunity=50%, Deal=90%) rather than an implicit or hidden number; (3) **Win rate** = won deals ÷ (won + lost deals) — i.e., resolved/closed deals only, never divided by total deals including still-open ones (including open deals in the denominator silently deflates win rate and is a commonly cited calculation bug).
- Since the requirement explicitly treats "evaluations" and "forecasts" as one feature (per PROJECT.md), make sure this single view still keeps pipeline-value, weighted-forecast, and win-rate as clearly separate figures rather than blending them into one ambiguous "score."
- Document the stage-probability assumptions used, visibly, near the forecast numbers (even a tooltip) — since these are placeholder/mock-driven now, but will need real calibration against historical conversion data once live. This makes it obvious later that these are assumptions, not measured facts, avoiding false confidence in the demo.
- Exclude or clearly flag stale/stuck deals from forecast weighting if the mock data includes any notion of "time in stage" — real CRMs apply a "haircut" to stale deals since deals stuck too long in a stage are less likely to close at the stage's nominal probability.
- Compute all forecast numbers from the same source-of-truth deal/line-item data used by the table (via shared selectors), never from a separately maintained mock summary — otherwise the forecast page and the table can silently disagree once someone edits a deal.

**Warning signs:**
- Forecast page shows one number labeled just "Pipeline" or "Forecast" with no distinction between raw and weighted.
- Win rate formula divides by all deals ever created rather than only resolved (won+lost) deals.
- Stage probabilities hardcoded inline in a component rather than defined as a named, documented constant/config.
- Forecast numbers recomputed from a duplicate/separate mock dataset instead of derived from the same deals array the table renders.

**Phase to address:**
Forecast/analytics phase, but the *inputs* it depends on (stage history, resolved-deal state, per-deal value) must be correct from the stage-transition phase (Pitfall 3) — flag forecast phase as needing the stage/lost-deal data model finalized first.

---

### Pitfall 5: Editable grid state causing re-render storms or lost-edit bugs

**What goes wrong:**
Inline editing of deal fields and line items is implemented by mutating a large top-level state array directly, or by giving the table's row/column definitions a new reference on every render — both cause either infinite re-render loops or a whole-table re-render on every keystroke as the mock dataset grows past a couple dozen rows with subitems. Separately, a common data-grid bug: editing an item is implemented by scanning the array by value/index to find "the one being edited," which breaks silently once rows are grouped, filtered, or reordered (the index the edit handler captured no longer points at the same row).

**Why it happens:**
It's natural to reach for `useState` on a single big array of deals for a prototype, then pass down setters as inline closures recreated every render; with grouped, nested (line-item) data this scales badly faster than with flat lists, and the bugs (stale index references) don't show up until grouping/sorting/filtering is added on top of editing — which in this project happens because deals are grouped by stage.

**How to avoid:**
- Address every deal and line item by stable `id`, never by array index, in every update function (`updateDeal(id, patch)`, `updateLineItem(dealId, lineItemId, patch)`).
- Keep column/group definitions and callback props referentially stable (memoize handlers with `useCallback`/`useMemo`, or keep them defined outside the render if they don't depend on changing values) to avoid the classic infinite-re-render trap when using any table abstraction (custom or a library like TanStack Table).
- Prefer an immutable-update pattern (spread/replace, or a small reducer) over deep in-place mutation of the mock array, both because React needs the new-reference signal to re-render correctly and because this exact discipline is what a future real API integration (optimistic updates, rollback on error) will need anyway.
- If the dataset is expected to stay small (dozens of deals, single-digit line items each) for this prototype phase, don't reach for virtualization or a heavyweight grid library preemptively — but do keep the update functions id-based from day one, since that costs nothing now and prevents a rewrite later.

**Warning signs:**
- Update functions that take an array index rather than an id.
- Inline arrow functions passed as event handlers/cell renderers recreated every render inside a large table.
- Editing a line item requires finding its parent deal by scanning the whole deals array by value equality rather than an id lookup.
- Visible lag or the wrong row updating when editing while the table is grouped/filtered.

**Phase to address:**
Table/inline-editing phase — verify with a "grouped + filtered + edit" manual test before considering the phase done.

---

### Pitfall 6: Prototype built with assumptions that don't survive merge into the existing iDrive project

**What goes wrong:**
The prototype is built as a fully standalone app (its own routing, its own global state approach, its own CSS scoping, possibly its own React/toolchain version) without checking what conventions the existing iDrive project already uses. When integration time comes, large parts have to be rewritten rather than dropped in — duplicate React instances, CSS bleeding into/from the host app's styles, routing collisions, or state-management mismatches (e.g., prototype uses Context+useState but the host app uses Redux/Zustand) force a redo rather than a merge.

**Why it happens:**
Since the existing project's code isn't available/present during this milestone (per PROJECT.md), there's a natural tendency to make free, convenient choices — but every convenient choice not documented as a *reversible* decision becomes friction at integration time, especially styling and state management, which are the two areas most commonly cited as integration pain points when merging standalone React work into a host app.

**How to avoid:**
- Scope all CSS locally (CSS Modules or a scoped approach) rather than global stylesheets/resets, so dropping the prototype's components into the host app doesn't clash with its existing styles.
- Keep state management simple and localized (component state / Context, as already implied by "in-app state, no persistence layer") rather than introducing a global store that assumes it owns the whole app — this keeps the door open for whatever the host app already uses.
- Avoid assuming ownership of top-level routing; build the CRM views as embeddable feature components/routes rather than a full standalone app shell, so they can be mounted inside another app's router later.
- Document, in the code/README, every external assumption made (React version/features used, any third-party UI library chosen) so a future integration pass has a checklist rather than a surprise.
- Keep the data-access layer (Pitfall 1) as the explicit seam: integration primarily means swapping the mock data-access functions for real API calls, not rewriting components — this is the single biggest lever for a low-friction merge.

**Warning signs:**
- Global CSS resets, unscoped class names (`.card`, `.button`) with no namespace.
- A global state library introduced "just in case" for a single-user, mock-data prototype.
- Hardcoded root-level route paths (`/`) rather than a mountable feature route.
- No single obvious place where "swap mock for API" would happen — mock reads scattered across many components.

**Phase to address:**
Should be an explicit architectural constraint applied across all phases, but called out and checked at the end (a pre-handoff/integration-readiness review) rather than owned by one phase alone.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|--------------------|-----------------|------------------|
| Storing computed fields (deal total, forecast value) directly on mock records | Faster to write, no selector logic needed | Values drift out of sync after edits; must be re-derived and re-verified when wiring to a real API that computes these server-side | Never — compute via a selector/helper even in mock data |
| Flat `stage` field mixing funnel stage + won/lost | One field, one dropdown, simplest possible UI | Breaks forecast/win-rate math and loses pre-loss stage history | Never for this project, given forecast is an explicit v1 requirement |
| Freeform-text-only lost reason | Fastest form field to build | Unusable for aggregate "why do we lose deals" reporting later | Acceptable only as a supplementary note alongside a required reason category, never as the sole field |
| Array-index-based row identity | No need to invent IDs for mock data | Breaks the moment rows are grouped/sorted/filtered, causes edit-the-wrong-row bugs | Never — always assign stable ids, even for mock/seed data |
| Global CSS / unscoped class names | Faster initial styling | Style collisions when merged into host app | Acceptable only if renamed/scoped before handoff — track as a known cleanup item, don't let it linger |
| Deeply nested subitem trees (subitems of subitems) | Looks flexible / future-proof | Combinatorial UI/state complexity, contradicts monday.com's own one-level design | Never for v1; revisit only if a real product requirement demands multi-level BOM-style items |

## Integration Gotchas

Common mistakes when this prototype is eventually wired to a real backend/API.

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Real API replacing mock data | Components call the mock array/state directly, so every component needs editing when the API arrives | Route all reads/writes through a small data-access module (`dealsApi.ts`) from day one; only that module changes at integration time |
| Server-computed aggregates (totals, forecast) | Frontend keeps its own mock-forecast formulas that silently diverge from what the real backend later computes | Treat forecast formulas as an explicit, named, documented spec (not implicit component logic) so the real backend can be built to match, or the frontend can be pointed at a server endpoint with minimal change |
| Pagination / large datasets | Prototype assumes "all deals fit in memory," works fine on 20 mock rows, breaks or is naive once real data arrives (this is a top-cited real-world CRM integration failure) | Not required to build pagination now, but keep the data-access layer's function signatures forward-compatible with eventually accepting filters/paging params, so real integration doesn't need to change every call site |
| Authentication (deferred) | Data-access layer assumes no auth context ever, making it hard to later inject auth headers/user scoping | Keep the data-access layer as a single choke point (see above) — the same seam that swaps mock-for-real-API is where auth headers get added later, with no other change needed |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Whole-table re-render on every keystroke while editing | Visible input lag, focus loss while typing in a cell | Memoize row/cell components; keep per-row state local where possible; avoid recreating column/handler definitions each render | Noticeable once dataset has a few dozen deals with several line items each — small for this prototype, but worth avoiding the trap now since it's cheap to prevent early |
| Recomputing forecast aggregates on every render from scratch | Forecast page feels sluggish when the deal list is large or updated frequently | Memoize derived forecast values (`useMemo`) keyed off the deals array reference | Not urgent at prototype scale, but establishes the right pattern before real data volume arrives |

## Security Mistakes

Since this phase is explicitly frontend-only, no-auth, and mock-data-only, most conventional CRM security concerns (auth, data access control, PII handling) are out of scope by design. The one domain-relevant item:

| Mistake | Risk | Prevention |
|---------|------|------------|
| Hardcoding realistic-looking customer/company names, emails, or deal values in seed data that later gets committed to a shared/public repo | Looks like real customer data even though it's fake; can cause confusion or be mistaken for a leak | Use clearly fictional names/domains (e.g., "Acme Test Co", `example.com`) in seed data, never real prospect/customer names even for internal demos |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Marking a deal "Lost" with no confirmation or required reason capture | Users accidentally lose deals without a reason, making the Lost group's data useless for later analysis | Require a reason (from a predefined list) as part of the lost-transition action itself, not an optional follow-up edit |
| No visual distinction between "raw pipeline value" and "weighted/projected" forecast numbers | Stakeholders anchor on the bigger, unweighted number and are later surprised when real revenue falls short | Label the two numbers distinctly and place the weighted/projected figure most prominently, with raw pipeline as secondary context |
| Collapsing/expanding line items loses scroll position or resets on every parent-level edit | Feels janky, discourages use of the subitem feature | Keep expand/collapse state keyed by deal id in local UI state, untouched by data edits elsewhere |
| Dragging a deal between stage groups with no undo | A misclick silently changes pipeline state with no easy recovery | Provide a lightweight undo (toast with "Undo" action) for stage moves, especially lost/won transitions |

## "Looks Done But Isn't" Checklist

- [ ] **Grouped table view:** Often missing a defined behavior for empty groups (e.g., no deals currently in "Lead") — verify each stage group renders sensibly with zero items rather than disappearing or erroring
- [ ] **Line items / subitems:** Often missing rollup consistency — verify the deal-level total always equals the sum of its line-item subtotals after every edit, add, or delete of a line item
- [ ] **Lost-deal handling:** Often missing enforcement — verify it's actually impossible to reach a "Lost" state through the UI without a reason selected, not just that the field exists
- [ ] **Won deals / contracts list:** Often missing the "same entity, different view" discipline — verify the contracts view is a filtered/derived view of deals (won only), not a second copy of deal data that can drift out of sync
- [ ] **Forecast page:** Often missing units/labels precision — verify every number on the page is unambiguously labeled as raw vs. weighted, and that win rate's denominator excludes still-open deals
- [ ] **Mock data layer:** Often missing the "one seam" property — verify there is exactly one module/set of functions that would need to change to swap mock data for real API calls, not reads scattered through components
- [ ] **Inline editing:** Often missing correctness under grouping — verify editing a deal or line item updates the correct record after the table has been grouped, filtered, or reordered (test by index-based bugs specifically)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|------------------|
| Mock data shaped for UI convenience, not future API (Pitfall 1) | MEDIUM | Introduce the data-access-layer seam retroactively: wrap existing direct array reads/writes in `getDeals()`/`updateDeal()` functions without changing component logic, then reshape the underlying mock data behind that seam incrementally |
| Flat stage field conflating funnel + terminal states (Pitfall 3) | MEDIUM | Add a derived `pipelineStage` snapshot captured at the moment of transition to lost/won, backfilled onto existing mock records; split the field going forward |
| Forecast built on raw/unweighted pipeline value only (Pitfall 4) | LOW | Add a stage-probability config and a second computed "weighted value" figure alongside the existing raw sum; no data model change required if stage is already tracked |
| Array-index-based edit bugs surfacing after grouping/filtering added (Pitfall 5) | LOW-MEDIUM | Retrofit stable `id` fields onto mock records if missing, then change update functions to look up by id instead of index — mechanical but must touch every call site |
| Standalone-app assumptions blocking merge into host project (Pitfall 6) | HIGH | Requires a dedicated integration pass: scope CSS, extract routing assumptions, and verify no global state library conflicts before the merge — budget this as its own phase rather than a quick fix |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|--------------------|----------------|
| Mock data shaped like UI state, not a future API resource | Data-model / foundation phase | A documented entity schema exists (Deal, LineItem, Stage, LostReason) with stable ids, before table UI work begins; all reads/writes go through named data-access functions |
| Deep/uncontrolled line-item nesting | Grouped-table UI phase | Line-item type has no self-referential nesting; deal-move and lost-transition explicitly define line-item behavior |
| Stage-transition & lost-deal logic as "just a field edit" | Stage-transition / lost-deal phase | Cannot reach "Lost" state via UI without selecting a reason from a fixed list; pipelineStage is preserved distinctly from outcome (won/lost) |
| Forecast computed as vanity aggregate | Forecast/analytics phase | Forecast page shows raw pipeline value, weighted/projected value, and win rate as three distinct, clearly labeled numbers; win rate denominator excludes open deals |
| Editable grid re-render / stale-index bugs | Table/inline-editing phase | Manual test: group, filter or sort, then edit a deal and a line item — correct record updates in both cases |
| Standalone-prototype assumptions blocking future merge | Cross-cutting / final integration-readiness review | CSS is scoped, no global routing/state assumptions baked in, and the mock-to-API seam is a single identifiable module |

## Sources

- [The Most Common CRM Integration Mistakes (and How to Avoid Them)](https://mindcloud.co/resources/the-most-common-crm-integration-mistakes-and-how-to-avoid-them)
- [5 Common CRM Integration Mistakes That Hurt Your ROI](https://devtrios.com/blog/crm-integration-mistakes/)
- [Pipeline Management in CRM: Avoiding Common Pitfalls and Mistakes](https://gridlex.com/a/pipeline-management-in-crm-avoiding-common-pitfalls-and-mistakes-st8573/)
- [8 Common Sales Pipeline Mistakes to Avoid](https://www.leadfeeder.com/blog/conversion-optimization/sales-pipeline-mistakes/)
- [How to use pipeline-weighted techniques for better sales forecasting](https://www.drivetrain.ai/post/pipeline-weighted-sales-forecasting)
- [Weighted Sales Pipeline Explained: Formula, Example & Use](https://forecastio.ai/blog/weighted-pipeline)
- [What is Weighted Sales Pipeline and Why It's Problematic](https://now.iseeit.com/problem-with-weighted-pipeline-or-how-to-improve-forecast-accuracy/)
- [How to Calculate Win Rate by Sales Stage](https://orm-tech.com/blog/how-to-calculate-win-rate-by-stage)
- [Track Lost Deal Reasons to Boost Sales](https://www.folk.app/articles/why-you-should-track-your-lost-deal-reasons)
- [Best Practices for Tracking Lost Sales in Your CRM](https://www.techadv.com/blog/best-practices-tracking-lost-sales-your-crm)
- [The Real Reasons Your B2B Deals Are Stalling](https://medium.com/@dexterwrites2022/the-real-reasons-your-b2b-deals-are-stalling-and-why-your-crm-wont-tell-you-c71bddcb454c)
- [Multiple levels of subitems on monday.com – Support](https://support.monday.com/hc/en-us/articles/29810815287570-Multiple-levels-of-subitems-on-monday-com)
- [All about subitems – Support](https://support.monday.com/hc/en-us/articles/360011905480-All-about-subitems)
- [How to supercharge your workflow with subitems | monday.com Blog](https://monday.com/blog/product/how-to-supercharge-your-workflow-with-subitems/)
- [Setting up a Local Mock API for your Front-end (React) Project](https://blog.harveydelaney.com/setting-up-a-mock-api-for-your-front-end-react-project/)
- [How to Mock an API for Frontend Development Without Waiting for the Backend | Mimicry](https://mimicry.rest/blog/how-to-mock-apis)
- [API-First Development: Building for Flexibility and Scale](https://strapi.io/blog/api-first-development-guide)
- [react-table FAQ (TanStack) on reference stability / infinite re-render](https://github.com/tannerlinsley/react-table/blob/master/./docs/faq.md)
- [Performance and Rendering Issues with DevExtreme Data Grid and React State](https://supportcenter.devexpress.com/ticket/details/t803811/performance-and-rendering-issues-with-devextreme-data-grid-and-react-state)
- [React Data Grid Editing Overview - KendoReact](https://www.telerik.com/kendo-react-ui/components/grid/editing)
- [Field Guide to Merging Codebases](https://dev.to/jdsteinhauser/field-guide-to-merging-codebases-bb8)
- [React Component Prototyping: Using UXPin with Your Codebase](https://www.uxpin.com/studio/blog/react-component-prototyping-using-uxpin-with-your-codebase/)

---
*Pitfalls research for: CRM sales-pipeline UI prototype (React, mock-data-first)*
*Researched: 2026-08-28*
