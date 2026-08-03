import { QuestionTypeId, StageId, STAGE_LABELS } from "@/lib/question-taxonomy";

export type AnswerRecord = {
  questionTypeId: QuestionTypeId;
  stageId: StageId | null;
  questionText: string;
  optionText: string;
  value: number;
};

export type TrafficLight = "RED" | "YELLOW" | "GREEN";

export type StageResult = {
  stageId: StageId;
  label: string;
  answeredCount: number;
  level: number | null;
  trafficLight: TrafficLight | null;
  levelLabel: string | null;
  levelDescription: string | null;
  questions: { questionText: string; optionText: string }[];
};

export type FoundationResult = {
  score: number;
  max: number;
  band: "Critical" | "Partial" | "Ready" | null;
  flagText: string | null;
  questions: { questionText: string; optionText: string }[];
};

export type GovernanceResult = {
  answeredCount: number;
  level: number | null;
  trafficLight: TrafficLight | null;
  levelLabel: string | null;
  levelDescription: string | null;
  questions: { questionText: string; optionText: string }[];
};

export type VarianceFlag = { title: string; message: string };

export type TrafficLightSummary = {
  total: number;
  band: "Initial" | "Emerging" | "Advanced" | "AI-Native";
};

export type Report = {
  stages: StageResult[];
  overallLevel: number | null;
  overallLevelLabel: string | null;
  overallLevelDescription: string | null;
  foundation: FoundationResult;
  governance: GovernanceResult;
  varianceFlags: VarianceFlag[];
  trafficLightSummary: TrafficLightSummary | null;
  topStrengths: { stageLabel: string; level: number }[];
  topGaps: { stageLabel: string; level: number }[];
};

const LEVEL_BANDS = [
  {
    min: 0.0,
    max: 0.9,
    label: "Traditional",
    description:
      "AI is not used. All activities in this stage are performed manually without AI assistance.",
  },
  {
    min: 1.0,
    max: 1.9,
    label: "Experimental",
    description:
      "AI usage exists through individual initiative only. No organizational guidance or standard tooling.",
  },
  {
    min: 2.0,
    max: 2.9,
    label: "AI-Assisted",
    description:
      "AI tools are officially available and used, but adoption is inconsistent and not yet standardized.",
  },
  {
    min: 3.0,
    max: 3.9,
    label: "AI-Enabled",
    description: "AI is embedded in defined workflows. Practices are consistent and governance exists.",
  },
  {
    min: 4.0,
    max: 4.4,
    label: "AI-Optimized",
    description: "AI adoption is measured and continuously improved. Outcomes are tracked and reported.",
  },
  {
    min: 4.5,
    max: 5.0,
    label: "AI-Native",
    description:
      "AI is the default participant in this stage. Human effort focuses on validation and decision-making.",
  },
] as const;

// Absolute point thresholds per the guide (§5) — not rescaled if fewer than 3
// Foundation questions are answered (e.g. one was hidden after submission).
// That's a rare edge case the guide itself doesn't define rescaled bands for.
const FOUNDATION_BANDS = [
  {
    min: 0,
    max: 2,
    band: "Critical" as const,
    flagText: "AI adoption is constrained by missing infrastructure.",
  },
  { min: 3, max: 5, band: "Partial" as const, flagText: null },
  { min: 6, max: 9, band: "Ready" as const, flagText: null },
];

const STAGE_IDS: StageId[] = [
  StageId.DemandDefinition,
  StageId.ImplementationPlanning,
  StageId.ImplementationCoding,
  StageId.Testing,
  StageId.PullRequestReview,
  StageId.DeploymentDelivery,
];

function roundToOneDecimal(n: number): number {
  return Math.round(n * 10) / 10;
}

function getLevelBand(level: number) {
  return LEVEL_BANDS.find((b) => level >= b.min && level <= b.max) ?? LEVEL_BANDS[LEVEL_BANDS.length - 1];
}

export function computeLevel(answeredPoints: number, answeredCount: number): number | null {
  if (answeredCount === 0) return null;
  return roundToOneDecimal((answeredPoints / (answeredCount * 3)) * 5);
}

export function computeTrafficLight(level: number): TrafficLight {
  if (level < 2.0) return "RED";
  if (level < 3.0) return "YELLOW";
  return "GREEN";
}

type LevelResult = {
  level: number | null;
  trafficLight: TrafficLight | null;
  levelLabel: string | null;
  levelDescription: string | null;
};

function computeLevelResult(points: number, count: number): LevelResult {
  const level = computeLevel(points, count);
  if (level == null) {
    return { level: null, trafficLight: null, levelLabel: null, levelDescription: null };
  }
  const band = getLevelBand(level);
  return {
    level,
    trafficLight: computeTrafficLight(level),
    levelLabel: band.label,
    levelDescription: band.description,
  };
}

function toQuestionList(answers: AnswerRecord[]) {
  return answers.map((a) => ({ questionText: a.questionText, optionText: a.optionText }));
}

function computeStageResult(stageId: StageId, stageAnswers: AnswerRecord[]): StageResult {
  const points = stageAnswers.reduce((sum, a) => sum + a.value, 0);
  return {
    stageId,
    label: STAGE_LABELS[stageId],
    answeredCount: stageAnswers.length,
    questions: toQuestionList(stageAnswers),
    ...computeLevelResult(points, stageAnswers.length),
  };
}

function computeGovernanceResult(governanceAnswers: AnswerRecord[]): GovernanceResult {
  const points = governanceAnswers.reduce((sum, a) => sum + a.value, 0);
  return {
    answeredCount: governanceAnswers.length,
    questions: toQuestionList(governanceAnswers),
    ...computeLevelResult(points, governanceAnswers.length),
  };
}

function computeFoundation(foundationAnswers: AnswerRecord[]): FoundationResult {
  const score = foundationAnswers.reduce((sum, a) => sum + a.value, 0);
  const max = foundationAnswers.length * 3;
  if (foundationAnswers.length === 0) {
    return { score: 0, max: 0, band: null, flagText: null, questions: [] };
  }
  const bandInfo =
    FOUNDATION_BANDS.find((b) => score >= b.min && score <= b.max) ??
    FOUNDATION_BANDS[FOUNDATION_BANDS.length - 1];
  return {
    score,
    max,
    band: bandInfo.band,
    flagText: bandInfo.flagText,
    questions: toQuestionList(foundationAnswers),
  };
}

function computeOverallLevel(stages: StageResult[]): number | null {
  const levels = stages.map((s) => s.level).filter((l): l is number => l != null);
  if (levels.length === 0) return null;
  return roundToOneDecimal(levels.reduce((sum, l) => sum + l, 0) / levels.length);
}

function computeTopStrengthsAndGaps(stages: StageResult[]) {
  const withLevel = stages.filter(
    (s): s is StageResult & { level: number } => s.level != null
  );
  const ascending = [...withLevel].sort((a, b) => a.level - b.level);
  const descending = [...withLevel].sort((a, b) => b.level - a.level);
  return {
    topStrengths: descending.slice(0, 2).map((s) => ({ stageLabel: s.label, level: s.level })),
    topGaps: ascending.slice(0, 2).map((s) => ({ stageLabel: s.label, level: s.level })),
  };
}

const TRAFFIC_LIGHT_POINTS: Record<TrafficLight, number> = { RED: 0, YELLOW: 1, GREEN: 2 };

function computeTrafficLightSummary(stages: StageResult[]): TrafficLightSummary | null {
  const lights = stages.map((s) => s.trafficLight).filter((t): t is TrafficLight => t != null);
  if (lights.length === 0) return null;
  const total = lights.reduce((sum, light) => sum + TRAFFIC_LIGHT_POINTS[light], 0);
  let band: TrafficLightSummary["band"];
  if (total <= 4) band = "Initial";
  else if (total <= 7) band = "Emerging";
  else if (total <= 10) band = "Advanced";
  else band = "AI-Native";
  return { total, band };
}

function computeVarianceFlags(params: {
  stages: StageResult[];
  overallLevel: number | null;
  foundation: FoundationResult;
  governanceLevel: number | null;
}): VarianceFlag[] {
  const { stages, overallLevel, foundation, governanceLevel } = params;
  const flags: VarianceFlag[] = [];

  if (overallLevel != null) {
    for (const stage of stages) {
      if (stage.level != null && overallLevel - stage.level >= 2.0) {
        flags.push({
          title: "Critical Gap",
          message: `${stage.label} is significantly below average. This constrains overall pipeline effectiveness regardless of other stage scores.`,
        });
      }
    }
  }

  if (foundation.max > 0 && foundation.score < 3) {
    flags.push({
      title: "Foundation Gap",
      message:
        "AI infrastructure is insufficient to support reliable adoption across stages. Stage scores may understate potential once tooling is addressed.",
    });
  }

  if (governanceLevel != null && governanceLevel < 2.0) {
    flags.push({
      title: "Governance Risk",
      message:
        "AI adoption is proceeding without adequate governance. Data protection, security, and quality risks should be addressed alongside adoption improvements.",
    });
  }

  const stage3 = stages.find((s) => s.stageId === StageId.ImplementationCoding);
  const stage5 = stages.find((s) => s.stageId === StageId.PullRequestReview);
  const stage6 = stages.find((s) => s.stageId === StageId.DeploymentDelivery);
  const codingIsHigh = stage3?.level != null && stage3.level > 3.0;
  const reviewOrDeliveryIsLow =
    (stage5?.level != null && stage5.level < 2.0) || (stage6?.level != null && stage6.level < 2.0);
  if (codingIsHigh && reviewOrDeliveryIsLow) {
    flags.push({
      title: "Pipeline Bottleneck",
      message:
        "High implementation AI maturity is not matched by review or delivery AI maturity. This creates quality and speed bottlenecks downstream of coding.",
    });
  }

  return flags;
}

export function computeReport(answers: AnswerRecord[]): Report {
  const stages = STAGE_IDS.map((stageId) =>
    computeStageResult(
      stageId,
      answers.filter((a) => a.questionTypeId === QuestionTypeId.Stages && a.stageId === stageId)
    )
  );

  const foundation = computeFoundation(
    answers.filter((a) => a.questionTypeId === QuestionTypeId.Foundation)
  );
  const governance = computeGovernanceResult(
    answers.filter((a) => a.questionTypeId === QuestionTypeId.Governance)
  );

  const overallLevel = computeOverallLevel(stages);
  const overallBand = overallLevel == null ? null : getLevelBand(overallLevel);

  const varianceFlags = computeVarianceFlags({
    stages,
    overallLevel,
    foundation,
    governanceLevel: governance.level,
  });

  const { topStrengths, topGaps } = computeTopStrengthsAndGaps(stages);
  const trafficLightSummary = computeTrafficLightSummary(stages);

  return {
    stages,
    overallLevel,
    overallLevelLabel: overallBand?.label ?? null,
    overallLevelDescription: overallBand?.description ?? null,
    foundation,
    governance,
    varianceFlags,
    trafficLightSummary,
    topStrengths,
    topGaps,
  };
}
