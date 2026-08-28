import { statusClasses } from "@/lib/utils";
import type { TrafficLight } from "@/lib/scoring";

export function trafficLightClasses(light: TrafficLight | null): string {
  switch (light) {
    case "RED":
      return statusClasses("bad");
    case "YELLOW":
      return statusClasses("warn");
    case "GREEN":
      return statusClasses("good");
    default:
      return "border-border bg-muted/30 text-muted-foreground";
  }
}

export function formatLevel(level: number | null): string {
  return level == null ? "—" : level.toFixed(1);
}
