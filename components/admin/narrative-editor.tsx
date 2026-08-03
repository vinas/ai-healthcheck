"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { StageId, STAGE_LABELS } from "@/lib/question-taxonomy";
import ExecutiveSummaryStep from "@/components/admin/narrative/executive-summary-step";
import StageInterpretationStep from "@/components/admin/narrative/stage-interpretation-step";
import RoadmapStep from "@/components/admin/narrative/roadmap-step";
import BenchmarkContextStep from "@/components/admin/narrative/benchmark-context-step";
import ReviewStep from "@/components/admin/narrative/review-step";
import StepFooter from "@/components/admin/narrative/step-footer";
import { emptyDraft, type NarrativeBundle, type NarrativeDraft, type StepId } from "@/components/admin/narrative/types";

const STAGE_IDS: StageId[] = [
  StageId.DemandDefinition,
  StageId.ImplementationPlanning,
  StageId.ImplementationCoding,
  StageId.Testing,
  StageId.PullRequestReview,
  StageId.DeploymentDelivery,
];

const STEPS: { id: StepId; label: string }[] = [
  { id: "summary", label: "Executive Summary" },
  ...STAGE_IDS.map((id) => ({ id: `stage-${id}` as StepId, label: STAGE_LABELS[id] })),
  { id: "roadmap", label: "Recommended Roadmap" },
  { id: "benchmark", label: "Benchmark Context" },
  { id: "review", label: "Review & Publish" },
];

type LoadState = "loading" | "notFound" | "notCompleted" | "ready" | "error";

type NarrativeEditorProps = { uniqueKey: string };

export default function NarrativeEditor({ uniqueKey }: NarrativeEditorProps) {
  const [state, setState] = useState<LoadState>("loading");
  const [bundle, setBundle] = useState<NarrativeBundle | null>(null);
  const [draft, setDraft] = useState<NarrativeDraft>(emptyDraft());
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<StepId>("summary");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/narratives/${uniqueKey}`);
        if (res.status === 404) {
          setState("notFound");
          return;
        }
        if (res.status === 409) {
          setState("notCompleted");
          return;
        }
        if (!res.ok) {
          setState("error");
          return;
        }
        const data: NarrativeBundle = await res.json();
        setBundle(data);
        if (data.narrative) {
          setDraft({
            executiveSummary: data.narrative.executiveSummary,
            stageInterpretations: data.narrative.stageInterpretations,
            roadmap: data.narrative.roadmap,
            benchmarkContext: data.narrative.benchmarkContext,
          });
          setPublishedAt(data.narrative.publishedAt);
        }
        setState("ready");
      } catch {
        setState("error");
      }
    }
    load();
  }, [uniqueKey]);

  async function goToStep(next: StepId) {
    if (next === activeStep) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/narratives/${uniqueKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Failed to save.");
        return;
      }
      setActiveStep(next);
    } catch {
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      const res = await fetch(`/api/narratives/${uniqueKey}/publish`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setPublishedAt(data.publishedAt);
        toast.success("Narrative published.");
      } else {
        toast.error(data.error ?? "Failed to publish.");
      }
    } catch {
      toast.error("An unexpected error occurred while publishing.");
    } finally {
      setPublishing(false);
    }
  }

  if (state === "loading") {
    return <p className="px-8 py-6 text-sm text-muted-foreground">Loading…</p>;
  }

  if (state === "notFound") {
    return (
      <div className="flex flex-col gap-2 px-8 py-6">
        <p className="text-sm text-foreground">Client key not found.</p>
        <Link href="/admin" className="text-sm text-primary underline">
          Back to admin
        </Link>
      </div>
    );
  }

  if (state === "notCompleted") {
    return (
      <div className="flex flex-col gap-2 px-8 py-6">
        <p className="text-sm text-foreground">
          This assessment hasn&apos;t been completed yet. Narrative and recommendations can be
          written once the client submits their answers.
        </p>
        <Link href="/admin" className="text-sm text-primary underline">
          Back to admin
        </Link>
      </div>
    );
  }

  if (state === "error" || !bundle) {
    return (
      <p className="px-8 py-6 text-sm text-destructive">
        Something went wrong while loading this narrative.
      </p>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.id === activeStep);
  const previousStep = currentIndex > 0 ? STEPS[currentIndex - 1] : null;
  const nextStep = currentIndex < STEPS.length - 1 ? STEPS[currentIndex + 1] : null;

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 px-8 py-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Narrative — {bundle.client.name}</h1>
          <p className="text-sm text-muted-foreground">Report: {bundle.uniqueKey}</p>
        </div>

        {publishedAt ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            <span className="font-medium">Published — live on the client&apos;s report.</span>{" "}
            Changes you make here are saved and go live immediately as you move between steps —
            there&apos;s no separate publish step to update it.
          </div>
        ) : (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
            <span className="font-medium">Draft — not visible to the client yet.</span> Changes are
            saved automatically as you move between steps, but nothing shows on the client&apos;s
            report until you publish from the Review step.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {STEPS.map((step) => (
            <button
              key={step.id}
              type="button"
              disabled={saving}
              onClick={() => goToStep(step.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                activeStep === step.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted/50"
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border p-4">
          {activeStep === "summary" && (
            <ExecutiveSummaryStep
              report={bundle.report}
              value={draft.executiveSummary}
              onChange={(v) => setDraft((d) => ({ ...d, executiveSummary: v }))}
            />
          )}
          {STAGE_IDS.map((stageId) =>
            activeStep === `stage-${stageId}` ? (
              <StageInterpretationStep
                key={stageId}
                stage={bundle.report.stages.find((s) => s.stageId === stageId)!}
                value={draft.stageInterpretations[String(stageId)] ?? ""}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    stageInterpretations: { ...d.stageInterpretations, [String(stageId)]: v },
                  }))
                }
              />
            ) : null
          )}
          {activeStep === "roadmap" && (
            <RoadmapStep
              report={bundle.report}
              items={draft.roadmap}
              onChange={(items) => setDraft((d) => ({ ...d, roadmap: items }))}
            />
          )}
          {activeStep === "benchmark" && (
            <BenchmarkContextStep
              contextAnswers={bundle.contextAnswers}
              value={draft.benchmarkContext}
              onChange={(v) => setDraft((d) => ({ ...d, benchmarkContext: v }))}
            />
          )}
          {activeStep === "review" && (
            <ReviewStep
              draft={draft}
              publishedAt={publishedAt}
              publishing={publishing}
              onEditStep={(step) => setActiveStep(step)}
              onPublish={handlePublish}
            />
          )}
        </div>
      </div>

      <StepFooter
        onBack={previousStep ? () => goToStep(previousStep.id) : undefined}
        onNext={nextStep ? () => goToStep(nextStep.id) : undefined}
        disabled={saving}
      />
    </>
  );
}
