import type { Report } from "@/lib/scoring";
import { StageId } from "@/lib/question-taxonomy";
import {
  STAGE_GUIDANCE,
  WRITING_GUIDELINES,
  ROADMAP_GUIDANCE,
  BENCHMARK_GUIDANCE,
  computeCalibrationNotes,
  type ContextAnswer,
} from "@/lib/narrative-guidance";

export type DraftTarget =
  | "summary"
  | "stage-1"
  | "stage-2"
  | "stage-3"
  | "stage-4"
  | "stage-5"
  | "stage-6"
  | "roadmap"
  | "benchmark";

export type DraftContext = { report: Report; contextAnswers: ContextAnswer[] };

export type RoadmapItem = { what: string; why: string; effort: "Low" | "Medium" | "High" };

export type RoadmapToolSchema = {
  name: "propose_roadmap";
  description: string;
  strict: true;
  input_schema: {
    type: "object";
    properties: {
      items: {
        type: "array";
        items: {
          type: "object";
          properties: {
            what: { type: "string" };
            why: { type: "string" };
            effort: { type: "string"; enum: ["Low", "Medium", "High"] };
          };
          required: ["what", "why", "effort"];
          additionalProperties: false;
        };
      };
    };
    required: ["items"];
    additionalProperties: false;
  };
};

export type PromptSpec =
  | { kind: "text"; system: string; user: string }
  | { kind: "roadmap"; system: string; user: string; tool: RoadmapToolSchema };

const VALID_TARGETS = new Set<DraftTarget>([
  "summary",
  "stage-1",
  "stage-2",
  "stage-3",
  "stage-4",
  "stage-5",
  "stage-6",
  "roadmap",
  "benchmark",
]);

export function isDraftTarget(value: unknown): value is DraftTarget {
  return typeof value === "string" && VALID_TARGETS.has(value as DraftTarget);
}

const ROLE_FRAMING =
  "You are drafting a section of an AI-adoption maturity assessment report. A human reviewer will read, edit, and decide whether to publish your draft before the client ever sees it — write a solid first draft, not a final answer.";

function guidelinesBlock(): string {
  return `Writing guidelines:\n${WRITING_GUIDELINES.map((g) => `- ${g}`).join("\n")}`;
}

function textSystemPrompt(): string {
  return `${ROLE_FRAMING}\n\n${guidelinesBlock()}\n\nRespond with plain prose only — no markdown headings, bullet points, or formatting.`;
}

function roadmapSystemPrompt(): string {
  return `${ROLE_FRAMING}\n\n${guidelinesBlock()}\n\nUse the propose_roadmap tool to return your answer as structured data — do not respond with plain text.`;
}

function buildSummaryPrompt(report: Report): PromptSpec {
  const { overallLevel, overallLevelLabel, overallLevelDescription, topStrengths, topGaps, trafficLightSummary, varianceFlags, foundation, governance } = report;
  const lines = [
    `Overall level: ${overallLevel ?? "N/A"} (${overallLevelLabel ?? "N/A"}) — ${overallLevelDescription ?? "no description available"}`,
    trafficLightSummary
      ? `Traffic-light summary: ${trafficLightSummary.band} (${trafficLightSummary.total}/12 points)`
      : null,
    `Top strengths: ${topStrengths.map((s) => `${s.stageLabel} (${s.level})`).join(", ") || "none"}`,
    `Top gaps: ${topGaps.map((s) => `${s.stageLabel} (${s.level})`).join(", ") || "none"}`,
    varianceFlags.length > 0
      ? `Active flags: ${varianceFlags.map((f) => `${f.title}: ${f.message}`).join(" | ")}`
      : null,
    `Foundation: ${foundation.band ?? "N/A"}${foundation.flagText ? ` — ${foundation.flagText}` : ""}`,
    `Governance: ${governance.level ?? "N/A"} (${governance.levelLabel ?? "N/A"})`,
    "",
    guidelinesBlock(),
    "",
    "Write a 2-3 sentence executive summary synthesizing the above.",
  ];
  return { kind: "text", system: textSystemPrompt(), user: lines.filter(Boolean).join("\n") };
}

function buildStagePrompt(target: DraftTarget, report: Report): PromptSpec {
  const stageId = Number(target.replace("stage-", "")) as StageId;
  const stage = report.stages.find((s) => s.stageId === stageId);
  const guidance = STAGE_GUIDANCE[stageId];
  const lines = [
    `Stage: ${stage?.label ?? "Unknown"}`,
    `Level: ${stage?.level ?? "N/A"} (${stage?.levelLabel ?? "N/A"}), traffic light: ${stage?.trafficLight ?? "N/A"}`,
    `What this stage measures: ${guidance.whatThisMeasures}`,
    guidance.note ? `Note: ${guidance.note}` : null,
    stage && stage.questions.length > 0
      ? `Answers:\n${stage.questions.map((q) => `- ${q.questionText} → ${q.optionText}`).join("\n")}`
      : null,
    "",
    guidelinesBlock(),
    "",
    `Write a 2-3 sentence interpretation of this stage's result, using its official level label ("${stage?.levelLabel ?? "N/A"}") rather than inventing new terminology.`,
  ];
  return { kind: "text", system: textSystemPrompt(), user: lines.filter(Boolean).join("\n") };
}

const ROADMAP_TOOL: RoadmapToolSchema = {
  name: "propose_roadmap",
  description: "Return the recommended roadmap as structured items.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            what: { type: "string" },
            why: { type: "string" },
            effort: { type: "string", enum: ["Low", "Medium", "High"] },
          },
          required: ["what", "why", "effort"],
          additionalProperties: false,
        },
      },
    },
    required: ["items"],
    additionalProperties: false,
  },
};

function buildRoadmapPrompt(report: Report, contextAnswers: ContextAnswer[]): PromptSpec {
  const { topGaps, varianceFlags, stages } = report;
  const calibrationNotes = computeCalibrationNotes(contextAnswers);
  const lines = [
    `Stage levels: ${stages.map((s) => `${s.label}: ${s.level ?? "N/A"}`).join(", ")}`,
    `Top gaps: ${topGaps.map((g) => `${g.stageLabel} (${g.level})`).join(", ") || "none"}`,
    varianceFlags.length > 0
      ? `Active flags: ${varianceFlags.map((f) => `${f.title}: ${f.message}`).join(" | ")}`
      : null,
    calibrationNotes.length > 0
      ? `Context calibration notes:\n${calibrationNotes.map((n) => `- ${n}`).join("\n")}`
      : null,
    "",
    `Roadmap guidance:\n${ROADMAP_GUIDANCE.map((g) => `- ${g}`).join("\n")}`,
    "",
    guidelinesBlock(),
    "",
    "Propose 3-5 prioritized roadmap items via the propose_roadmap tool.",
  ];
  return {
    kind: "roadmap",
    system: roadmapSystemPrompt(),
    user: lines.filter(Boolean).join("\n"),
    tool: ROADMAP_TOOL,
  };
}

function buildBenchmarkPrompt(report: Report, contextAnswers: ContextAnswer[]): PromptSpec {
  const calibrationNotes = computeCalibrationNotes(contextAnswers);
  const lines = [
    `Overall level: ${report.overallLevel ?? "N/A"} (${report.overallLevelLabel ?? "N/A"})`,
    `Foundation: ${report.foundation.band ?? "N/A"}`,
    `Governance: ${report.governance.level ?? "N/A"} (${report.governance.levelLabel ?? "N/A"})`,
    contextAnswers.length > 0
      ? `Organization context:\n${contextAnswers.map((a) => `- ${a.questionText} → ${a.optionText}`).join("\n")}`
      : null,
    calibrationNotes.length > 0
      ? `Applicable calibration notes:\n${calibrationNotes.map((n) => `- ${n}`).join("\n")}`
      : null,
    "",
    `Benchmark guidance: ${BENCHMARK_GUIDANCE}`,
    "",
    guidelinesBlock(),
    "",
    "Write one paragraph framing these scores relative to this organization's size and industry.",
  ];
  return { kind: "text", system: textSystemPrompt(), user: lines.filter(Boolean).join("\n") };
}

export function buildDraftPrompt(target: DraftTarget, context: DraftContext): PromptSpec {
  const { report, contextAnswers } = context;
  if (target === "summary") return buildSummaryPrompt(report);
  if (target === "roadmap") return buildRoadmapPrompt(report, contextAnswers);
  if (target === "benchmark") return buildBenchmarkPrompt(report, contextAnswers);
  return buildStagePrompt(target, report);
}
