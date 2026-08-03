import { describe, it, expect } from "vitest";
import { buildDraftPrompt, isDraftTarget, type DraftTarget } from "../narrative-ai-draft";
import { StageId, STAGE_LABELS } from "../question-taxonomy";
import type { Report, StageResult } from "../scoring";
import type { ContextAnswer } from "../narrative-guidance";

function stageResult(stageId: StageId, level: number | null, overrides: Partial<StageResult> = {}): StageResult {
  return {
    stageId,
    label: STAGE_LABELS[stageId],
    answeredCount: level == null ? 0 : 5,
    level,
    trafficLight: level == null ? null : level < 2 ? "RED" : level < 3 ? "YELLOW" : "GREEN",
    levelLabel: level == null ? null : "AI-Assisted",
    levelDescription: level == null ? null : "some description",
    questions: [{ questionText: "Q1?", optionText: "Answer A" }],
    ...overrides,
  };
}

function baseReport(overrides: Partial<Report> = {}): Report {
  const stages = [
    stageResult(StageId.DemandDefinition, 3.3),
    stageResult(StageId.ImplementationPlanning, 4.0),
    stageResult(StageId.ImplementationCoding, 2.7),
    stageResult(StageId.Testing, 1.7),
    stageResult(StageId.PullRequestReview, 2.0),
    stageResult(StageId.DeploymentDelivery, 1.7),
  ];
  return {
    stages,
    overallLevel: 2.6,
    overallLevelLabel: "AI-Assisted",
    overallLevelDescription: "AI tools are officially available and used.",
    foundation: {
      score: 5,
      max: 9,
      band: "Partial",
      flagText: null,
      interpretationText: "Some infrastructure exists.",
      questions: [],
    },
    governance: {
      answeredCount: 5,
      level: 1.7,
      trafficLight: "RED",
      levelLabel: "Experimental",
      levelDescription: "some description",
      questions: [],
    },
    varianceFlags: [{ title: "Governance Risk", message: "Governance is lagging." }],
    trafficLightSummary: { total: 6, band: "Emerging" },
    topStrengths: [{ stageLabel: "Implementation Planning", level: 4.0 }],
    topGaps: [{ stageLabel: "Testing", level: 1.7 }],
    ...overrides,
  };
}

const contextAnswers: ContextAnswer[] = [
  {
    questionText:
      "How many software developers (including QA, DevOps, and related roles) does your organization employ?",
    optionText: "Fewer than 10",
  },
];

describe("isDraftTarget", () => {
  it("accepts every valid target", () => {
    const valid: DraftTarget[] = [
      "summary",
      "stage-1",
      "stage-2",
      "stage-3",
      "stage-4",
      "stage-5",
      "stage-6",
      "roadmap",
      "benchmark",
    ];
    for (const t of valid) expect(isDraftTarget(t)).toBe(true);
  });

  it("rejects unknown or non-string values", () => {
    expect(isDraftTarget("stage-7")).toBe(false);
    expect(isDraftTarget("review")).toBe(false);
    expect(isDraftTarget(42)).toBe(false);
    expect(isDraftTarget(undefined)).toBe(false);
  });
});

describe("buildDraftPrompt", () => {
  it("builds a text prompt for summary containing the computed data", () => {
    const spec = buildDraftPrompt("summary", { report: baseReport(), contextAnswers: [] });
    expect(spec.kind).toBe("text");
    expect(spec.user).toContain("2.6");
    expect(spec.user).toContain("AI-Assisted");
    expect(spec.user).toContain("Testing (1.7)");
    expect(spec.user).toContain("Implementation Planning (4)");
    expect(spec.user).toContain("Governance Risk");
    expect(spec.system).toContain("official level labels");
  });

  it("builds a stage prompt using the correct stage's guidance, not another stage's", () => {
    const spec = buildDraftPrompt("stage-3", { report: baseReport(), contextAnswers: [] });
    expect(spec.kind).toBe("text");
    expect(spec.user).toContain("Implementation (Coding)");
    expect(spec.user).toContain("Clients frequently overstate adoption here");
    expect(spec.user).not.toContain("often the least mature");
  });

  it("builds a roadmap prompt with a forced tool schema", () => {
    const spec = buildDraftPrompt("roadmap", { report: baseReport(), contextAnswers: [] });
    expect(spec.kind).toBe("roadmap");
    if (spec.kind !== "roadmap") throw new Error("expected roadmap kind");
    expect(spec.tool.strict).toBe(true);
    expect(spec.tool.input_schema.additionalProperties).toBe(false);
    expect(spec.tool.input_schema.properties.items.items.properties.effort.enum).toEqual([
      "Low",
      "Medium",
      "High",
    ]);
    expect(spec.user).toContain("Testing (1.7)");
    expect(spec.user).toContain("Governance Risk");
  });

  it("builds a benchmark prompt including matched calibration notes", () => {
    const spec = buildDraftPrompt("benchmark", { report: baseReport(), contextAnswers });
    expect(spec.kind).toBe("text");
    expect(spec.user).toContain("fewer than 10 developers");
    expect(spec.user).toContain("Fewer than 10");
  });

  it("omits calibration notes from the benchmark prompt when nothing matches", () => {
    const spec = buildDraftPrompt("benchmark", { report: baseReport(), contextAnswers: [] });
    expect(spec.kind).toBe("text");
    expect(spec.user).not.toContain("Applicable calibration notes");
  });
});
