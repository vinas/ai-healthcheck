import type { Report } from "@/lib/scoring";

export type RoadmapItem = { what: string; why: string; effort: "Low" | "Medium" | "High" };

export type NarrativeDraft = {
  executiveSummary: string;
  stageInterpretations: Record<string, string>;
  roadmap: RoadmapItem[];
  benchmarkContext: string;
};

export type ContextAnswer = { questionText: string; optionText: string };

export type NarrativeBundle = {
  client: { id: number; name: string };
  uniqueKey: string;
  report: Report;
  contextAnswers: ContextAnswer[];
  narrative: (NarrativeDraft & { publishedAt: string | null }) | null;
};

export type StepId =
  | "summary"
  | "stage-1"
  | "stage-2"
  | "stage-3"
  | "stage-4"
  | "stage-5"
  | "stage-6"
  | "roadmap"
  | "benchmark"
  | "review";

export function emptyDraft(): NarrativeDraft {
  return { executiveSummary: "", stageInterpretations: {}, roadmap: [], benchmarkContext: "" };
}
