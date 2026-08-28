import type { Report } from "@/lib/scoring";

type TopStrengthsGapsProps = {
  topStrengths: Report["topStrengths"];
  topGaps: Report["topGaps"];
};

export function TopStrengthsGaps({ topStrengths, topGaps }: TopStrengthsGapsProps) {
  if (topStrengths.length === 0 && topGaps.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <h2 className="mb-2 text-base font-semibold text-foreground">Top Strengths</h2>
        <ul className="flex flex-col gap-1">
          {topStrengths.map((s) => (
            <li key={s.stageLabel} className="text-sm text-foreground">
              {s.stageLabel} — {s.level.toFixed(1)}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="mb-2 text-base font-semibold text-foreground">Top Gaps</h2>
        <ul className="flex flex-col gap-1">
          {topGaps.map((s) => (
            <li key={s.stageLabel} className="text-sm text-foreground">
              {s.stageLabel} — {s.level.toFixed(1)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
