import { useEffect } from "react";
import { PipelineBoard } from "@/features/pipeline/components/PipelineBoard";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";

/**
 * Mounts the pipeline board — the primary user-facing view of the
 * prototype (PIPE-01). Loads the seeded deals through the store on mount;
 * PipelineBoard renders all 5 pipeline-stage groups from that state.
 */
function App() {
  const load = usePipelineStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  return <PipelineBoard />;
}

export default App;
