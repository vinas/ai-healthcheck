import type { StageResult } from "@/lib/scoring";
import { formatLevel, trafficLightClasses } from "@/components/report/format";

export function TrafficLightDashboard({ stages }: { stages: StageResult[] }) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Traffic Light Dashboard</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stages.map((stage) => (
          <div
            key={stage.stageId}
            className={`rounded-lg border p-4 ${trafficLightClasses(stage.trafficLight)}`}
          >
            <p className="text-sm font-medium">{stage.label}</p>
            <p className="text-2xl font-bold">{formatLevel(stage.level)}</p>
            <p className="text-xs">{stage.levelLabel ?? "No data"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
