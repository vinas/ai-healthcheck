"use client";

import type { Report } from "@/lib/scoring";
import { WRITING_GUIDELINES } from "@/lib/narrative-guidance";

const textareaClass =
  "min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring";

type ExecutiveSummaryStepProps = {
  report: Report;
  value: string;
  onChange: (value: string) => void;
};

export default function ExecutiveSummaryStep({ report, value, onChange }: ExecutiveSummaryStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Executive Summary</h2>
        <p className="text-sm text-muted-foreground">
          Write a 2–3 sentence synthesis of the overall result, using the computed data below as reference.
        </p>
      </div>
      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
        <p className="font-medium text-foreground">
          Overall level: {report.overallLevel ?? "—"} · {report.overallLevelLabel ?? "Not available"}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Top strengths</p>
            <ul>
              {report.topStrengths.map((s) => (
                <li key={s.stageLabel} className="text-foreground">
                  {s.stageLabel} — {s.level.toFixed(1)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Top gaps</p>
            <ul>
              {report.topGaps.map((s) => (
                <li key={s.stageLabel} className="text-foreground">
                  {s.stageLabel} — {s.level.toFixed(1)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
        <p className="mb-1.5 font-medium text-foreground">Guidance</p>
        <ul className="list-disc pl-4 text-muted-foreground">
          {WRITING_GUIDELINES.map((line, i) => (
            <li key={i} className="mb-1 last:mb-0">
              {line}
            </li>
          ))}
        </ul>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Overall AI adoption sits at a solid AI-Assisted level, driven by strong implementation and testing practices..."
        className={textareaClass}
      />
    </div>
  );
}
