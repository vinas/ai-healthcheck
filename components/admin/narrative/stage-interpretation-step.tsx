"use client";

import type { StageResult } from "@/lib/scoring";
import { STAGE_GUIDANCE } from "@/lib/narrative-guidance";
import DraftButton from "@/components/admin/narrative/draft-button";

const textareaClass =
  "min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring";

type StageInterpretationStepProps = {
  stage: StageResult;
  value: string;
  onChange: (value: string) => void;
  onDraft: () => void;
  drafting: boolean;
};

export default function StageInterpretationStep({
  stage,
  value,
  onChange,
  onDraft,
  drafting,
}: StageInterpretationStepProps) {
  const guidance = STAGE_GUIDANCE[stage.stageId];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{stage.label}</h2>
        <p className="text-sm text-muted-foreground">
          Write a 2–3 sentence interpretation of this stage&apos;s result, using the data below as reference.
        </p>
      </div>
      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
        <p className="font-medium text-foreground">What this stage measures</p>
        <p className="mt-1 text-muted-foreground">{guidance.whatThisMeasures}</p>
        {guidance.note && <p className="mt-2 text-muted-foreground">{guidance.note}</p>}
        <p className="mt-3 text-muted-foreground">
          Use the level label below when describing this stage, and frame any gap constructively
          (e.g. what the next step would be) rather than as just a low score.
        </p>
      </div>
      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
        <p className="font-medium text-foreground">
          Level: {stage.level ?? "—"} · {stage.levelLabel ?? "No data"}
          {stage.trafficLight ? ` · ${stage.trafficLight}` : ""}
        </p>
        {stage.questions.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1.5">
            {stage.questions.map((q, i) => (
              <li key={i}>
                <p className="text-foreground">{q.questionText}</p>
                <p className="text-muted-foreground">→ {q.optionText}</p>
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
