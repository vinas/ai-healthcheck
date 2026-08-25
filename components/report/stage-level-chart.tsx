import type { StageResult, TrafficLight } from "@/lib/scoring";

function toneFor(light: TrafficLight | null): { fill: string; track: string } {
  switch (light) {
    case "GREEN":
      return { fill: "bg-green-600", track: "bg-green-100" };
    case "YELLOW":
      return { fill: "bg-yellow-500", track: "bg-yellow-100" };
    case "RED":
      return { fill: "bg-red-600", track: "bg-red-100" };
    default:
      return { fill: "bg-muted", track: "bg-muted/40" };
  }
}

export function StageLevelChart({ stages }: { stages: StageResult[] }) {
  const sorted = [...stages].sort((a, b) => (b.level ?? -1) - (a.level ?? -1));

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Maturity by Stage</h2>
      <div className="flex flex-col gap-4">
        {sorted.map((stage) => {
          const tone = toneFor(stage.trafficLight);
          const widthPct = stage.level == null ? 0 : (stage.level / 5) * 100;
          const title =
            stage.level == null
              ? `${stage.label}: no data`
              : `${stage.label}: ${stage.level.toFixed(1)} / 5 — ${stage.levelLabel}`;

          return (
            <div key={stage.stageId} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-foreground">{stage.label}</span>
                <span className="text-muted-foreground">
                  {stage.level == null ? "No data" : `${stage.level.toFixed(1)} · ${stage.levelLabel}`}
                </span>
              </div>
              <div className={`h-5 w-full overflow-hidden rounded-full ${tone.track}`} title={title}>
                <div className={`h-full rounded-full ${tone.fill}`} style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
