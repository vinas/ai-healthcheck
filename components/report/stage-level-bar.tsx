import { statusClasses } from "@/lib/utils";
import type { TrafficLight } from "@/lib/scoring";

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

function badgeClasses(light: TrafficLight | null): string {
  switch (light) {
    case "RED":
      return statusClasses("bad");
    case "YELLOW":
      return statusClasses("warn");
    case "GREEN":
      return statusClasses("good");
    default:
      return "bg-muted/30 text-muted-foreground";
  }
}

type StageLevelBarProps = {
  level: number | null;
  levelLabel: string | null;
  trafficLight: TrafficLight | null;
};

export function StageLevelBar({ level, levelLabel, trafficLight }: StageLevelBarProps) {
  const tone = toneFor(trafficLight);
  const widthPct = level == null ? 0 : (level / 5) * 100;
  const title = level == null ? "No data" : `${level.toFixed(1)} / 5 — ${levelLabel}`;

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <span
        className={`self-start rounded-md px-2 py-1 text-xs font-medium ${badgeClasses(trafficLight)}`}
      >
        {level == null ? "No data" : `${level.toFixed(1)} · ${levelLabel}`}
      </span>
      <div className={`h-2.5 w-full overflow-hidden rounded-full ${tone.track}`} title={title}>
        <div className={`h-full rounded-full ${tone.fill}`} style={{ width: `${widthPct}%` }} />
      </div>
    </div>
  );
}
