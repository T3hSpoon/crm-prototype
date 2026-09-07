import { useEffect } from "react";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import { toPipelineGroup } from "@/shared/utils/pipeline-group";

/**
 * Phase 1 tracer render — the thinnest possible proof that seed data flows
 * through MockDealsRepository -> usePipelineStore -> the screen. 01-03-PLAN.md
 * replaces this raw list with the real 5-group board; do not add
 * grouping/table UI here.
 */
function App() {
  const deals = usePipelineStore((s) => s.deals);
  const load = usePipelineStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <h1>Pipeline (tracer)</h1>
      <ul>
        {deals.map((d) => (
          <li key={d.id}>
            {d.name} — {d.company} — {toPipelineGroup(d)}
          </li>
        ))}
      </ul>
    </>
  );
}

export default App;
