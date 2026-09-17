import { useEffect, useState } from "react";
import { PipelineBoard } from "@/features/pipeline/components/PipelineBoard";
import { ForecastPage } from "@/features/forecast/components/ForecastPage";
import { DashboardPage } from "@/features/dashboard/components/DashboardPage";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Mounts the pipeline board and Forecast tab — the two top-level views of
 * the prototype (PIPE-01, FCST-01/FCST-02). Loads the seeded deals through
 * the store on mount. Both views are rendered unconditionally at all times;
 * only CSS `hidden` toggles visibility (D-02), so switching tabs never
 * remounts PipelineBoard and never resets its in-flight search/filter/sort
 * state — there is no router, this is a purely local view-state toggle
 * (D-01).
 */
function App() {
  const load = usePipelineStore((s) => s.load);
  const [tab, setTab] = useState<"pipeline" | "forecast" | "dashboard">("pipeline");

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "pipeline" | "forecast" | "dashboard")}
        className="mx-auto w-[95%] pt-4"
      >
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className={tab === "pipeline" ? "" : "hidden"}>
        <PipelineBoard />
      </div>
      <div className={tab === "forecast" ? "" : "hidden"}>
        <ForecastPage />
      </div>
      <div className={tab === "dashboard" ? "" : "hidden"}>
        <DashboardPage />
      </div>
    </>
  );
}

export default App;
