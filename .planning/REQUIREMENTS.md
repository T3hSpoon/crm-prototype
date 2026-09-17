# Requirements: iDrive CRM Prototype

**Defined:** 2026-09-17
**Core Value:** A working, demoable pipeline view — prospects flow through stages, lost deals are tracked with reasons, and won deals roll up as the contract list — solid enough to later wire into iDrive's existing project without a rebuild.

## v1 Requirements

Requirements for milestone v1.2. Each maps to roadmap phases.

### Dashboard

- [ ] **DASH-01**: User can view a Unit Sales Target gauge showing actual vs. target units, where units = summed line-item quantities across Won deals, against a seeded mock target
- [x] **DASH-02**: User can view a Target vs. Actual Sales chart plotting Won-deal unit volume by close date against the target, across the full closed-deal history
- [x] **DASH-03**: User can view a Leaderboard ranking owners by total Won deal value
- [ ] **DASH-04**: User can view a Conversion Rate funnel showing stage-by-stage % across Prospect → Lead → Opportunity → Deal → Won
- [ ] **DASH-05**: User can view a stacked bar chart of deals closed per time period, segmented by owner

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
| Activity tracker widget | Present in the monday.com reference screenshot; user explicitly said it can go away |
| Average-revenue stat tile | Present in the reference screenshot but not among the 5 widgets the user asked for |
| User-editable sales targets | Targets are seeded mock values for this milestone, consistent with the project's mock-data-only constraint; live editing deferred |
| Late-funnel-only conversion view (Opportunity→Deal→Won) | User chose the full Prospect→Lead→Opportunity→Deal→Won funnel instead |
| Lead-source dimension for the stacked bar / new `source` field on Deal | User chose "by owner" instead; adding a lead-source field is a schema change not needed for this milestone |
| Pixel-exact match to the monday.com reference screenshot | Reference used for widget/layout inspiration only, same convention as the original Pipeline board reference |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DASH-01 | Phase 6 | Pending |
| DASH-02 | Phase 6 | Complete |
| DASH-03 | Phase 6 | Complete |
| DASH-04 | Phase 6 | Pending |
| DASH-05 | Phase 6 | Pending |

**Coverage:**

- v1 requirements: 5 total
- Mapped to phases: 5
- Unmapped: 0

---
*Requirements defined: 2026-09-17*
*Last updated: 2026-09-17 after roadmap creation (Phase 6: Sales Dashboard)*
