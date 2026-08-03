"use client";

import type { ContextAnswer } from "@/components/admin/narrative/types";
import { BENCHMARK_GUIDANCE, computeCalibrationNotes } from "@/lib/narrative-guidance";
import DraftButton from "@/components/admin/narrative/draft-button";

const textareaClass =
  "min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring";

type BenchmarkContextStepProps = {
  contextAnswers: ContextAnswer[];
  value: string;
  onChange: (value: string) => void;
  onDraft: () => void;
  drafting: boolean;
};

export default function BenchmarkContextStep({
  contextAnswers,
  value,
  onChange,
  onDraft,
  drafting,
}: BenchmarkContextStepProps) {
  const calibrationNotes = computeCalibrationNotes(contextAnswers);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Benchmark Context</h2>
        <p className="text-sm text-muted-foreground">{BENCHMARK_GUIDANCE}</p>
      </div>
      {calibrationNotes.length > 0 && (
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
          <p className="mb-1.5 font-medium text-foreground">
            Guidance based on this client&apos;s context
          </p>
          <ul className="list-disc pl-4 text-muted-foreground">
            {calibrationNotes.map((note, i) => (
              <li key={i} className="mb-1 last:mb-0">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
        {contextAnswers.length === 0 ? (
          <p className="text-muted-foreground">No context answers recorded.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {contextAnswers.map((a, i) => (
              <li key={i}>
                <p className="text-foreground">{a.questionText}</p>
                <p className="text-muted-foreground">→ {a.optionText}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <DraftButton onDraft={onDraft} drafting={drafting} />
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className={textareaClass} />
    </div>
  );
}
