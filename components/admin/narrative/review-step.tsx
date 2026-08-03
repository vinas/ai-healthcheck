"use client";

import { Button } from "@/components/ui/button";
import type { NarrativeDraft, StepId } from "@/components/admin/narrative/types";

const STAGE_IDS = [1, 2, 3, 4, 5, 6] as const;

type ReviewStepProps = {
  draft: NarrativeDraft;
  publishedAt: string | null;
  publishing: boolean;
  onEditStep: (step: StepId) => void;
  onPublish: () => void;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function ReviewStep({
  draft,
  publishedAt,
  publishing,
  onEditStep,
  onPublish,
}: ReviewStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-foreground">Review</h2>

      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Executive Summary</h3>
          <button
            type="button"
            onClick={() => onEditStep("summary")}
            className="text-xs text-primary underline"
          >
            Edit
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{draft.executiveSummary || "Not written yet."}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-foreground">Stage Interpretations</h3>
        {STAGE_IDS.map((stageId) => (
          <div key={stageId} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Stage {stageId}</span>
              <button
                type="button"
                onClick={() => onEditStep(`stage-${stageId}` as StepId)}
                className="text-xs text-primary underline"
              >
                Edit
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {draft.stageInterpretations[String(stageId)] || "Not written yet."}
            </p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Recommended Roadmap</h3>
          <button
            type="button"
            onClick={() => onEditStep("roadmap")}
            className="text-xs text-primary underline"
          >
            Edit
          </button>
        </div>
        {draft.roadmap.length === 0 ? (
          <p className="text-sm text-muted-foreground">No roadmap items yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {draft.roadmap.map((item, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{item.what || "(untitled)"}</span> —{" "}
                {item.effort} effort
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Benchmark Context</h3>
          <button
            type="button"
            onClick={() => onEditStep("benchmark")}
            className="text-xs text-primary underline"
          >
            Edit
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{draft.benchmarkContext || "Not written yet."}</p>
      </section>

      <div className="border-t border-border pt-4">
        {publishedAt ? (
          <p className="text-sm text-foreground">Published on {formatDateTime(publishedAt)}.</p>
        ) : (
          <Button type="button" onClick={onPublish} disabled={publishing}>
            {publishing ? "Publishing…" : "Publish narrative"}
          </Button>
        )}
      </div>
    </div>
  );
}
