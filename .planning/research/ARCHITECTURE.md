# Architecture Research

**Domain:** React frontend CRM — grid/table pipeline board + forecast dashboard, frontend-only prototype with a mock data layer designed to be swapped for a real API later
**Researched:** 2026-08-28
**Confidence:** MEDIUM (general React architecture patterns cross-checked across multiple 2025-2026 sources; no domain-specific CRM-board case study found, but the underlying patterns — repository/adapter, feature folders, lightweight client state — are broadly consensus and low-risk for a prototype)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                            UI / Pages                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│  │ Pipeline Board  │  │ Deal Detail Panel│  │  Forecast Dashboard │  │
│  │ (grouped table) │  │ (line items,     │  │  (aggregates,       │  │
│  │                 │  │  lost-deal flow) │  │   charts, KPIs)     │  │
│  └────────┬────────┘  └────────┬─────────┘  └──────────┬──────────┘  │
│           │                    │                        │             │
├───────────┴────────────────────┴────────────────────────┴────────────┤
│                     Feature Hooks / Selectors                        │
│   usePipelineGroups()   useDeal(id)   useForecastMetrics()           │
├────────────────────────────────────────────────────────────────────┤
│                        Client State Store                            │
│              (Zustand store: deals, groups, ui state)                 │
├────────────────────────────────────────────────────────────────────┤
│                    Data Access Layer (the seam)                      │
│   DealsRepository interface  ──implemented by──▶  MockDealsRepository │
│                                └──later swap for──▶ ApiDealsRepository│
├────────────────────────────────────────────────────────────────────┤
│                         Mock Data Fixtures                            │
│              (seed deals, line items, lost-reason enums)              │
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Pipeline Board | Renders grouped table (Prospect/Lead/Opportunity/Deal-Won/Lost), row selection, drag-or-menu stage move, add-new-prospect entry point | A `PipelineBoard` container composing a `GroupSection` per stage, each rendering a `DealRow` table; owns only view-state (expanded groups, sort) — reads deal data via a hook, never touches the repository directly |
| Deal Detail / Line Items | Slide-over or modal showing one deal's fields plus its line-items sub-table (product/service, SKU, units, price, subtotal), inline edit | `DealDetailPanel` + `LineItemsTable`; edits dispatch store actions (`updateDeal`, `addLineItem`) rather than mutating props |
| Lost-Deal Flow | Captures the "mark as lost" action: confirmation + reason field, then reassigns the deal to the Lost group | A small `LostDealDialog` triggered from Deal Detail or a row action; on submit calls `store.markLost(dealId, reason)` — a single state transition, not a separate entity |
| Forecast Dashboard | Derives pipeline value, win rate, projected revenue from the same deal data set (no separate backend/entity) | A `ForecastPage` that reads deals via a **selector/derivation function** (pure functions over the deals array), not duplicated state — memoized with `useMemo` or store selectors |
| Data Access Layer | The seam: defines what "fetching/mutating deals" means, independent of whether the source is mock or real | A `DealsRepository` TypeScript interface (`list()`, `get(id)`, `create()`, `update()`, `markLost()`, `moveStage()`) with one concrete implementation (`MockDealsRepository`) backed by in-memory/seed data |
| Client State Store | Single source of truth for deals + line items + UI-only state (which group is collapsed, active modal) | Zustand store (or Context+useReducer as a lighter alternative) initialized from the repository on app mount, mutated only through named actions that call back into the repository |

## Recommended Project Structure

```
src/
├── app/                        # App shell, routing, providers
│   ├── App.tsx
│   └── routes.tsx              # /pipeline, /forecast
├── features/
│   ├── pipeline/                # Pipeline board feature
│   │   ├── components/
│   │   │   ├── PipelineBoard.tsx
│   │   │   ├── GroupSection.tsx
│   │   │   └── DealRow.tsx
│   │   ├── deal-detail/
│   │   │   ├── DealDetailPanel.tsx
│   │   │   └── LineItemsTable.tsx
│   │   ├── lost-deal/
│   │   │   └── LostDealDialog.tsx
│   │   ├── hooks/
│   │   │   ├── usePipelineGroups.ts
│   │   │   └── useDeal.ts
│   │   └── store/
│   │       └── pipelineStore.ts        # Zustand store + actions
│   └── forecast/                       # Forecast dashboard feature
│       ├── components/
│       │   ├── ForecastPage.tsx
│       │   └── KpiCard.tsx
│       └── selectors/
│           └── forecastMetrics.ts      # pure derivation functions
├── data/                                # THE SEAM — data access layer
│   ├── deals-repository.ts             # interface: DealsRepository
│   ├── mock/
│   │   ├── mock-deals-repository.ts    # implements DealsRepository
│   │   └── seed-data.ts                # fixtures: deals, line items, lost reasons
│   └── index.ts                        # exports the active repository instance
├── shared/                             # Cross-feature, reused code
│   ├── components/                     # Button, Modal, Table primitives
│   ├── types/
│   │   └── deal.ts                     # Deal, LineItem, PipelineStage types
│   └── utils/
└── main.tsx
```

### Structure Rationale

- **`features/pipeline/` and `features/forecast/`:** Organized by business capability, not technical layer (no global `components/`, `hooks/` catch-alls). Each feature owns its components/hooks; features don't import each other's internals — they share only through `shared/types` and `data/`. This keeps the pipeline board and forecast dashboard independently understandable and makes it obvious where the "lost deal" logic or "line items" logic lives.
- **`data/`:** Isolated at the top level, sibling to `features/`, not nested inside `pipeline/`, because both the pipeline board and the forecast dashboard consume the same deals data — it's a cross-cutting dependency, not feature-owned. This is also literally the file set that gets replaced when the real API is wired in later.
- **`shared/types/deal.ts`:** The `Deal`/`LineItem`/`PipelineStage` types are the contract every layer agrees on. Defining them once, independent of mock or real API, is what lets the repository swap happen without touching component code.
- **Zustand store lives inside `features/pipeline/store/`** rather than globally, because in this prototype only the pipeline feature needs mutable client state; the forecast feature is a pure read+derive consumer. If a second feature needed writable state later, promote the store to `shared/` or split per-feature stores.

## Architectural Patterns

### Pattern 1: Repository Pattern for the Data Seam

**What:** Define an abstract interface for every deal-data operation (`list`, `get`, `create`, `update`, `markLost`, `moveStage`) in `data/deals-repository.ts`. Implement it once now as `MockDealsRepository` (operates on an in-memory array seeded from fixtures, with artificial latency optional). Components, hooks, and the store never import the mock implementation directly — they import the interface type and receive an injected instance (via a `data/index.ts` singleton export, or a React context provider for testability).
**When to use:** Any time a frontend prototype's data layer is explicitly slated to be replaced (this project's core constraint). Applies even without a backend yet, because the discipline of "code against the interface" is what makes the eventual swap safe.
**Trade-offs:** Small amount of upfront ceremony (an interface + one implementation) for a payoff that only shows up later — but that payoff is *exactly* the milestone's stated goal ("swap mock for real API without a rewrite"). Skipping this is the single highest-risk shortcut for this project.

**Example:**
```typescript
// data/deals-repository.ts
export interface DealsRepository {
  list(): Promise<Deal[]>;
  get(id: string): Promise<Deal | undefined>;
  create(input: NewDealInput): Promise<Deal>;
  update(id: string, patch: Partial<Deal>): Promise<Deal>;
  markLost(id: string, reason: string): Promise<Deal>;
  moveStage(id: string, stage: PipelineStage): Promise<Deal>;
}

// data/mock/mock-deals-repository.ts
export class MockDealsRepository implements DealsRepository {
  private deals: Deal[] = [...seedDeals];
  async list() { return this.deals; }
  async markLost(id: string, reason: string) {
    const deal = this.deals.find(d => d.id === id)!;
    deal.stage = "lost";
    deal.lostReason = reason;
    return deal;
  }
  // ...
}

// data/index.ts — the one line that changes when the real API arrives
export const dealsRepository: DealsRepository = new MockDealsRepository();
// later: export const dealsRepository: DealsRepository = new ApiDealsRepository(httpClient);
```

### Pattern 2: Store Actions Call the Repository, Components Call the Store

**What:** Client state (Zustand or Context+useReducer) is the only thing components read from directly. Store actions are thin wrappers that call the repository, await the result, and update local state. This keeps the async/repository boundary out of component code entirely.
**When to use:** Always, once a repository seam exists — otherwise components end up calling the repository directly and re-implementing loading/error state per-component.
**Trade-offs:** One more indirection layer than "component calls repository directly," but it's what makes optimistic UI updates, loading states, and later real-API latency/error handling centrally manageable instead of scattered.

**Example:**
```typescript
// features/pipeline/store/pipelineStore.ts
export const usePipelineStore = create<PipelineState>((set, get) => ({
  deals: [],
  status: "idle",
  async load() {
    set({ status: "loading" });
    const deals = await dealsRepository.list();
    set({ deals, status: "ready" });
  },
  async markLost(id: string, reason: string) {
    const updated = await dealsRepository.markLost(id, reason);
    set({ deals: get().deals.map(d => d.id === id ? updated : d) });
  },
}));
```

### Pattern 3: Derived Data via Selectors, Not Duplicated State

**What:** The Forecast Dashboard's pipeline value, win rate, and projected revenue are *computed* from the same `deals` array the pipeline board uses — never stored as separate state that could drift out of sync. Implement as pure functions (`forecastMetrics.ts`) taking `Deal[]` and returning `{ totalValue, winRate, projectedRevenue }`, called from a `useForecastMetrics()` hook that memoizes over the store's deals.
**When to use:** Any dashboard/aggregate view that reads from the same underlying entity as a detail/list view (true here: forecast reads the same deals the pipeline board edits).
**Trade-offs:** Slightly more compute on every deals change (negligible at prototype scale — dozens to low hundreds of deals), versus the alternative of a second stateful "forecast store" that must be manually kept in sync and is a classic source of stale-dashboard bugs.

## Data Flow

### Request Flow (mock today, real API tomorrow — identical shape)

```
[User action: mark deal lost, add line item, move stage]
    ↓
[Component] → [Store action] → [dealsRepository.method()] → [MockDealsRepository / ApiDealsRepository]
    ↓                                                              ↓
[Store state updated] ← [awaited result] ← [in-memory mutation / eventual HTTP response]
    ↓
[Components re-render via store subscription]
```

The point of this shape: when `ApiDealsRepository` replaces `MockDealsRepository`, the arrows above do not change — only what happens inside the rightmost box (in-memory array mutation → `fetch()`/HTTP call).

### State Management

```
[Zustand pipelineStore: deals[], ui state]
    ↓ (subscribe via hooks)
[PipelineBoard, DealDetailPanel, ForecastPage]
    ↕ (call actions)
[Store actions] → [dealsRepository] → [store.set(...)]
```

### Key Data Flows

1. **Load on mount:** App mounts → `pipelineStore.load()` → `dealsRepository.list()` → store populated → Pipeline Board groups deals client-side by `stage` field (no separate "groups" entity — grouping is a derived view over `deals`).
2. **Edit deal / line items:** Deal Detail Panel edits → `updateDeal`/`addLineItem` store action → repository `update()` → store patches the single deal in place → both Pipeline Board row and (if open) Forecast Dashboard re-derive automatically.
3. **Move stage / mark lost:** Row action or Lost-Deal dialog → `moveStage`/`markLost` store action → repository mutates `stage`/`lostReason` → deal re-renders in its new group; no deal is ever deleted, only re-grouped by stage value.
4. **Forecast derivation:** Forecast Dashboard never calls the repository — it subscribes to the same store's `deals` and runs pure selector functions (`forecastMetrics(deals)`) on every relevant change.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Prototype (this phase, mock data, dozens-hundreds of deals) | In-memory array + Zustand store is sufficient; no virtualization, no pagination needed |
| Post-integration, real API, single org (hundreds-low thousands of deals) | Repository's `list()` gains filtering/pagination params; consider `@tanstack/react-query` layered on top of/instead of manual store `load()` for caching, refetch, and stale-while-revalidate — this is the natural next step once a real API exists |
| Multi-tenant / large orgs (10k+ deals) | Server-side grouping/aggregation for the Forecast Dashboard (don't compute win-rate over 10k rows client-side); virtualized table rows for the Pipeline Board |

### Scaling Priorities

1. **First bottleneck:** Not performance — it's the mock-to-real-API swap itself. Priority #1 is keeping the repository interface honest (no component ever imports `MockDealsRepository` directly, no component does its own `fetch`/array-filtering that bypasses the interface).
2. **Second bottleneck (post-integration):** Client-side forecast computation over the full deal set stops being cheap once real data volume grows; that's the trigger to move aggregation server-side or introduce a dedicated `/forecast` endpoint rather than recomputing from a full `list()`.

## Anti-Patterns

### Anti-Pattern 1: Components Importing the Mock Repository (or Seed Data) Directly

**What people do:** `import { seedDeals } from '../../../data/mock/seed-data'` inside a component, or `new MockDealsRepository()` scattered across files, "just to get something on screen quickly."
**Why it's wrong:** This is precisely the shortcut that turns the promised "swap mock for real API without a rewrite" into a rewrite — every direct import is a place that must be found and changed later, and it's easy to miss one.
**Do this instead:** Always go through the single exported `dealsRepository` instance (or a store built on top of it). If a component needs data, it calls a hook; the hook reads from the store; the store was populated via the repository interface.

### Anti-Pattern 2: A Separate "Forecast State" That Duplicates Deal Data

**What people do:** Build a second store or a set of `useState` hooks in the Forecast Dashboard that independently fetches/holds "forecast numbers," computed once and cached, separate from the live `deals` array the Pipeline Board mutates.
**Why it's wrong:** Guarantees the forecast page shows stale numbers the moment a deal is edited, moved, or marked lost elsewhere in the app — a classic dashboard-drift bug, and confusing to demo since "the forecast page doesn't update" looks broken.
**Do this instead:** Forecast Dashboard reads the same store, derives numbers with pure selector functions on render (memoized), never holds its own copy of deal data.

### Anti-Pattern 3: Treating "Lost" and "Won" as Separate Entities/Tables

**What people do:** Model `LostDeal` and `Contract` as distinct types/arrays with their own CRUD, requiring data to be copied or migrated between tables when a deal's status changes.
**Why it's wrong:** Contradicts the project's own decision (won deals double as "contracts," lost deals just get a reason field) and multiplies the surface area the future API integration has to match — more entities than the domain actually has.
**Do this instead:** One `Deal` type with a `stage` field (`prospect | lead | opportunity | won | lost`) and an optional `lostReason` field used only when `stage === "lost"`. Grouping in the UI is a client-side `groupBy(deals, d => d.stage)`, not a schema-level split.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Future real backend (existing iDrive project) | Write a new `ApiDealsRepository implements DealsRepository` that calls the real endpoints, then swap the single export in `data/index.ts` | Out of scope for this milestone — but this is the exact seam the whole architecture is built to keep clean. No component code should need to change. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Pipeline feature ↔ Forecast feature | Both read the same store/repository; no direct feature-to-feature imports | Keeps forecast and pipeline independently deployable/testable; they only share `shared/types` and `data/` |
| Components ↔ Store | Hooks (`usePipelineStore`, `useDeal(id)`, `useForecastMetrics()`) | Components never call the repository directly; store is the only consumer of `data/` |
| Store ↔ Data Access Layer | Store actions call `dealsRepository.*` methods and await results | This is the literal line that gets swapped from mock to real API later |
| Deal Detail ↔ Line Items | Line items are a field on `Deal` (`Deal.lineItems: LineItem[]`), not a separate repository | Keeps the interface small; `update()` on the repository handles nested line-item changes as part of the deal patch |

## Sources

- [State Management: Comparing Redux Toolkit, Zustand, and React Context](https://prakashinfotech.com/state-management-comparing-redux-toolkit-zustand-and-react-context) — MEDIUM confidence (cross-checked against multiple independent 2025-2026 comparison articles)
- [How to Choose Between Context API, Redux, and Zustand](https://oneuptime.com/blog/post/2026-01-15-choose-react-state-management-context-redux-zustand/view) — MEDIUM confidence
- [The Significance of Mock APIs and Repository Pattern in Developing React Apps](https://blazer-road.medium.com/the-significance-of-mock-apis-and-repository-pattern-in-developing-react-and-react-native-apps-20b219cb6600) — MEDIUM confidence
- [Repository Design Pattern — GeeksforGeeks](https://www.geeksforgeeks.org/system-design/repository-design-pattern/) — MEDIUM confidence
- [The Adapter Pattern in React: Bridging Data Sources and Components](https://medium.com/@ignatovich.dm/the-adapter-pattern-in-react-bridging-data-sources-and-components-01c5a27e0205) — MEDIUM confidence
- [bulletproof-react/docs/project-structure.md](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) — MEDIUM confidence (widely-cited reference implementation)
- [React Folder Structure Best Practices [2026] — Robin Wieruch](https://www.robinwieruch.de/react-folder-structure/) — MEDIUM confidence
- `.planning/PROJECT.md` — HIGH confidence (project's own stated requirements and constraints)

---
*Architecture research for: React frontend CRM pipeline board + forecast dashboard (frontend-only prototype)*
*Researched: 2026-08-28*
