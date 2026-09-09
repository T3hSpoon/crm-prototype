---
schema_version: 1
open_count: 2
waived_count: 0
fixed_count: 0
total_count: 2
last_updated: 2026-09-08T07:01:24.854Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 02 | unrun-verify | src/features/pipeline/components/DealDetailDrawer.tsx |  | Human-check verify steps for drawer open/edit/stage-select interactions (Task 1/2 <verify> human-check) not run interactively this session; build+typecheck only | open |  | 2026-09-08T07:01:19.845Z |  |
| 2 | 02 | unrun-verify | src/features/pipeline/components/EditableCell.tsx |  | Human-check verify steps for pipeline-table inline editing (Task 3 <verify> human-check: click into Value/Name/Owner/CloseDate cells, confirm no drawer side-effect) not run interactively this session; build+typecheck only | open |  | 2026-09-08T07:01:24.854Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "02",
    "file": "src/features/pipeline/components/DealDetailDrawer.tsx",
    "line": null,
    "description": "Human-check verify steps for drawer open/edit/stage-select interactions (Task 1/2 <verify> human-check) not run interactively this session; build+typecheck only",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T07:01:19.845Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "02",
    "file": "src/features/pipeline/components/EditableCell.tsx",
    "line": null,
    "description": "Human-check verify steps for pipeline-table inline editing (Task 3 <verify> human-check: click into Value/Name/Owner/CloseDate cells, confirm no drawer side-effect) not run interactively this session; build+typecheck only",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T07:01:24.854Z",
    "resolved_at": null
  }
]
````
