import { describe, it, expect } from "vitest";
import { computeLevel, computeTrafficLight, computeReport, type AnswerRecord } from "../scoring";
import { QuestionTypeId, StageId } from "../question-taxonomy";

function stageAnswers(stageId: StageId, values: number[]): AnswerRecord[] {
  return values.map((value, i) => ({
    questionTypeId: QuestionTypeId.Stages,
    stageId,
    questionText: `Stage ${stageId} Q${i}`,
    optionText: `Option worth ${value}`,
    value,
  }));
}

function foundationAnswers(values: number[]): AnswerRecord[] {
  return values.map((value, i) => ({
    questionTypeId: QuestionTypeId.Foundation,
    stageId: null,
    questionText: `F${i}`,
    optionText: `Option worth ${value}`,
    value,
  }));
}

function governanceAnswers(values: number[]): AnswerRecord[] {
  return values.map((value, i) => ({
    questionTypeId: QuestionTypeId.Governance,
    stageId: null,
    questionText: `G${i}`,
    optionText: `Option worth ${value}`,
    value,
  }));
}

// A "complete" 6-stage answer set with all stages at a fixed per-question value,
// used as a neutral baseline other tests can override one stage of.
function fullStageSet(valuePerQuestion: number): AnswerRecord[] {
  const stageIds = [
    StageId.DemandDefinition,
    StageId.ImplementationPlanning,
    StageId.ImplementationCoding,
    StageId.Testing,
    StageId.PullRequestReview,
    StageId.DeploymentDelivery,
  ];
  return stageIds.flatMap((id) => stageAnswers(id, Array(5).fill(valuePerQuestion)));
}

describe("computeLevel", () => {
  it("computes the standard 5-question formula", () => {
    expect(computeLevel(15, 5)).toBe(5.0);
    expect(computeLevel(0, 5)).toBe(0.0);
    expect(computeLevel(9, 5)).toBe(3.0);
    expect(computeLevel(6, 5)).toBe(2.0);
  });

  it("rounds to one decimal place", () => {
    expect(computeLevel(1, 5)).toBe(0.3); // 0.333...
    expect(computeLevel(2, 5)).toBe(0.7); // 0.667...
    expect(computeLevel(7, 5)).toBe(2.3); // 2.333...
    expect(computeLevel(14, 5)).toBe(4.7); // 4.667...
  });

  it("generalizes correctly for fewer than 5 answered questions (missing-answer adjustment)", () => {
    // guide's example shape: answered_count reduces the denominator, same formula
    expect(computeLevel(6, 3)).toBe(3.3); // (6/9)*5 = 3.333...
    expect(computeLevel(2, 1)).toBe(3.3); // (2/3)*5 = 3.333...
    expect(computeLevel(3, 2)).toBe(2.5); // (3/6)*5 = 2.5
  });

  it("returns null when nothing was answered", () => {
    expect(computeLevel(0, 0)).toBeNull();
  });
});

describe("computeTrafficLight", () => {
  it("is RED below 2.0", () => {
    expect(computeTrafficLight(0)).toBe("RED");
    expect(computeTrafficLight(1.9)).toBe("RED");
  });

  it("is YELLOW from 2.0 up to (not including) 3.0", () => {
    expect(computeTrafficLight(2.0)).toBe("YELLOW");
    expect(computeTrafficLight(2.9)).toBe("YELLOW");
  });

  it("is GREEN from 3.0 up", () => {
    expect(computeTrafficLight(3.0)).toBe("GREEN");
    expect(computeTrafficLight(5.0)).toBe("GREEN");
  });
});

describe("computeReport — level bands and labels", () => {
  it.each([
    [0, "Traditional"],
    [3, "Experimental"], // level 1.0
    [6, "AI-Assisted"], // level 2.0
    [9, "AI-Enabled"], // level 3.0
  ])("labels a stage scoring %i raw points as %s", (points, expectedLabel) => {
    const values = Array(5).fill(0);
    let remaining = points;
    for (let i = 0; i < values.length && remaining > 0; i++) {
      const take = Math.min(3, remaining);
      values[i] = take;
      remaining -= take;
    }
    const report = computeReport(stageAnswers(StageId.DemandDefinition, values));
    const stage = report.stages.find((s) => s.stageId === StageId.DemandDefinition)!;
    expect(stage.levelLabel).toBe(expectedLabel);
  });

  it("labels exactly 4.4 as AI-Optimized and 4.5 as AI-Native (the tightest band boundary)", () => {
    // A contrived answer count lets us hit these exact fractional levels, which
    // aren't reachable from a realistic 5-question integer point sum.
    // count=25, points=66 -> (66/75)*5 = 4.4 exactly.
    const values44 = [...Array(22).fill(3), 0, 0, 0];
    const report44 = computeReport(stageAnswers(StageId.Testing, values44));
    const stage44 = report44.stages.find((s) => s.stageId === StageId.Testing)!;
    expect(stage44.level).toBe(4.4);
    expect(stage44.levelLabel).toBe("AI-Optimized");

    // count=10, points=27 -> (27/30)*5 = 4.5 exactly.
    const values45 = [3, 3, 3, 3, 3, 3, 3, 3, 3, 0];
    const report45 = computeReport(stageAnswers(StageId.Testing, values45));
    const stage45 = report45.stages.find((s) => s.stageId === StageId.Testing)!;
    expect(stage45.level).toBe(4.5);
    expect(stage45.levelLabel).toBe("AI-Native");
  });

  it("labels the top of the scale (5.0) as AI-Native", () => {
    const report = computeReport(stageAnswers(StageId.DemandDefinition, Array(5).fill(3)));
    const stage = report.stages.find((s) => s.stageId === StageId.DemandDefinition)!;
    expect(stage.level).toBe(5.0);
    expect(stage.levelLabel).toBe("AI-Native");
  });

  it("has no level/label/trafficLight when a stage has zero answers", () => {
    const report = computeReport([]);
    const stage = report.stages.find((s) => s.stageId === StageId.DemandDefinition)!;
    expect(stage.level).toBeNull();
    expect(stage.levelLabel).toBeNull();
    expect(stage.trafficLight).toBeNull();
    expect(stage.answeredCount).toBe(0);
  });
});

describe("computeReport — overall level", () => {
  it("averages only the 6 lifecycle stages, excluding Foundation and Governance", () => {
    const answers = [
      ...fullStageSet(3), // all 6 stages at level 5.0
      ...foundationAnswers([0, 0, 0]), // Foundation at 0 — must not affect overall
      ...governanceAnswers([0, 0, 0, 0, 0]), // Governance at 0 — must not affect overall
    ];
    const report = computeReport(answers);
    expect(report.overallLevel).toBe(5.0);
    expect(report.overallLevelLabel).toBe("AI-Native");
  });

  it("is null when no stage has any answers", () => {
    const report = computeReport(foundationAnswers([3, 3, 3]));
    expect(report.overallLevel).toBeNull();
  });
});

describe("computeReport — Foundation", () => {
  it("bands 0-2 as Critical, with the guide's exact flag and interpretation text", () => {
    const report = computeReport(foundationAnswers([0, 1, 1]));
    expect(report.foundation.score).toBe(2);
    expect(report.foundation.band).toBe("Critical");
    expect(report.foundation.flagText).toBe("AI adoption is constrained by missing infrastructure.");
    expect(report.foundation.interpretationText).toBe(
      "Stage scores may significantly understate potential."
    );
  });

  it("bands 3-5 as Partial, with no flag text but the guide's interpretation text", () => {
    const report = computeReport(foundationAnswers([1, 1, 2]));
    expect(report.foundation.score).toBe(4);
    expect(report.foundation.band).toBe("Partial");
    expect(report.foundation.flagText).toBeNull();
    expect(report.foundation.interpretationText).toBe(
      "Some infrastructure exists. Report flags stages where missing integrations likely limit AI effectiveness."
    );
  });

  it("bands 6-9 as Ready, with no flag text but the guide's interpretation text", () => {
    const report = computeReport(foundationAnswers([2, 2, 3]));
    expect(report.foundation.score).toBe(7);
    expect(report.foundation.band).toBe("Ready");
    expect(report.foundation.flagText).toBeNull();
    expect(report.foundation.interpretationText).toBe(
      "Infrastructure supports meaningful AI adoption. No additional flag."
    );
  });

  it("does not normalize to a 0-5 level — score/max stay on the 0-9 scale", () => {
    const report = computeReport(foundationAnswers([3, 3, 3]));
    expect(report.foundation.score).toBe(9);
    expect(report.foundation.max).toBe(9);
  });

  it("has a zero score/max/null band/null interpretation when nothing was answered", () => {
    const report = computeReport([]);
    expect(report.foundation.score).toBe(0);
    expect(report.foundation.max).toBe(0);
    expect(report.foundation.band).toBeNull();
    expect(report.foundation.interpretationText).toBeNull();
  });
});

describe("computeReport — Governance", () => {
  it("uses the same stage-level formula/bands as the 6 lifecycle stages", () => {
    const report = computeReport(governanceAnswers([3, 3, 3, 3, 3]));
    expect(report.governance.level).toBe(5.0);
    expect(report.governance.levelLabel).toBe("AI-Native");
    expect(report.governance.trafficLight).toBe("GREEN");
  });
});

describe("computeReport — variance flags", () => {
  it("flags Critical Gap for a stage 2.0+ below the overall average", () => {
    const answers = [
      ...stageAnswers(StageId.DemandDefinition, [3, 3, 3, 3, 3]), // 5.0
      ...stageAnswers(StageId.ImplementationPlanning, [3, 3, 3, 3, 3]), // 5.0
      ...stageAnswers(StageId.ImplementationCoding, [3, 3, 3, 3, 3]), // 5.0
      ...stageAnswers(StageId.Testing, [3, 3, 3, 3, 3]), // 5.0
      ...stageAnswers(StageId.PullRequestReview, [3, 3, 3, 3, 3]), // 5.0
      ...stageAnswers(StageId.DeploymentDelivery, [0, 0, 0, 0, 0]), // 0.0 — overall avg = 25/6 = 4.166...
    ];
    const report = computeReport(answers);
    const criticalGap = report.varianceFlags.find((f) => f.title === "Critical Gap");
    expect(criticalGap?.message).toBe(
      "Deployment & Delivery is significantly below average. This constrains overall pipeline effectiveness regardless of other stage scores."
    );
  });

  it("does not flag Critical Gap when no stage is 2.0+ below average", () => {
    const report = computeReport(fullStageSet(2)); // all stages equal — no gap possible
    expect(report.varianceFlags.find((f) => f.title === "Critical Gap")).toBeUndefined();
  });

  it("flags Foundation Gap when the score is below 3, with the guide's exact text", () => {
    const report = computeReport(foundationAnswers([1, 0, 1]));
    const flag = report.varianceFlags.find((f) => f.title === "Foundation Gap");
    expect(flag?.message).toBe(
      "AI infrastructure is insufficient to support reliable adoption across stages. Stage scores may understate potential once tooling is addressed."
    );
  });

  it("does not flag Foundation Gap at exactly 3 or when nothing was answered", () => {
    expect(computeReport(foundationAnswers([1, 1, 1])).varianceFlags.find((f) => f.title === "Foundation Gap")).toBeUndefined();
    expect(computeReport([]).varianceFlags.find((f) => f.title === "Foundation Gap")).toBeUndefined();
  });

  it("flags Governance Risk when governance level is below 2.0, with the guide's exact text", () => {
    const report = computeReport(governanceAnswers([0, 0, 1, 0, 0]));
    const flag = report.varianceFlags.find((f) => f.title === "Governance Risk");
    expect(flag?.message).toBe(
      "AI adoption is proceeding without adequate governance. Data protection, security, and quality risks should be addressed alongside adoption improvements."
    );
  });

  it("flags Pipeline Bottleneck when Coding is high (>3.0) and Review or Delivery is low (<2.0)", () => {
    const answers = [
      ...stageAnswers(StageId.ImplementationCoding, [3, 3, 3, 3, 2]), // points=14 -> 4.7
      ...stageAnswers(StageId.PullRequestReview, [0, 0, 0, 0, 0]), // 0.0
    ];
    const report = computeReport(answers);
    const flag = report.varianceFlags.find((f) => f.title === "Pipeline Bottleneck");
    expect(flag?.message).toBe(
      "High implementation AI maturity is not matched by review or delivery AI maturity. This creates quality and speed bottlenecks downstream of coding."
    );
  });

  it("does not flag Pipeline Bottleneck when Coding is not above 3.0", () => {
    const answers = [
      ...stageAnswers(StageId.ImplementationCoding, [1, 1, 1, 1, 1]), // 1.7
      ...stageAnswers(StageId.PullRequestReview, [0, 0, 0, 0, 0]),
    ];
    const report = computeReport(answers);
    expect(report.varianceFlags.find((f) => f.title === "Pipeline Bottleneck")).toBeUndefined();
  });
});

describe("computeReport — top strengths and gaps", () => {
  it("picks the 2 highest-level stages as strengths and 2 lowest as gaps", () => {
    const answers = [
      ...stageAnswers(StageId.DemandDefinition, [3, 3, 3, 3, 3]), // 5.0 (strongest)
      ...stageAnswers(StageId.ImplementationPlanning, [2, 2, 2, 2, 2]), // 3.3
      ...stageAnswers(StageId.ImplementationCoding, [1, 1, 1, 1, 1]), // 1.7
      ...stageAnswers(StageId.Testing, [0, 0, 0, 0, 0]), // 0.0 (weakest)
      // Pull Request Review and Deployment & Delivery left unanswered — excluded (null level)
    ];
    const report = computeReport(answers);
    expect(report.topStrengths.map((s) => s.stageLabel)).toEqual(["Demand Definition", "Implementation Planning"]);
    expect(report.topGaps.map((s) => s.stageLabel)).toEqual(["Testing", "Implementation (Coding)"]);
  });
});

describe("computeReport — traffic light summary", () => {
  it.each([
    [0, "Initial"],
    [4, "Initial"],
    [5, "Emerging"],
    [7, "Emerging"],
    [8, "Advanced"],
    [10, "Advanced"],
    [11, "AI-Native"],
    [12, "AI-Native"],
  ])("bands a traffic-light total of %i as %s", (targetTotal, expectedBand) => {
    // Build exactly targetTotal points across 6 stages using RED=0/YELLOW=1/GREEN=2 per stage
    const perStage: number[] = [];
    let remaining = targetTotal;
    for (let i = 0; i < 6; i++) {
      const v = Math.min(2, remaining);
      perStage.push(v);
      remaining -= v;
    }
    const stageIds = [
      StageId.DemandDefinition,
      StageId.ImplementationPlanning,
      StageId.ImplementationCoding,
      StageId.Testing,
      StageId.PullRequestReview,
      StageId.DeploymentDelivery,
    ];
    // RED needs level <2.0 (e.g. 0 pts -> 0.0), YELLOW needs 2.0-2.9 (e.g. 6 pts -> 2.0), GREEN needs >=3.0 (e.g. 9 pts -> 3.0)
    const pointsForLight = [0, 6, 9]; // index 0=RED,1=YELLOW,2=GREEN
    const answers = stageIds.flatMap((id, i) => {
      const points = pointsForLight[perStage[i]];
      const values = Array(5).fill(0);
      let rem = points;
      for (let q = 0; q < 5 && rem > 0; q++) {
        const take = Math.min(3, rem);
        values[q] = take;
        rem -= take;
      }
      return stageAnswers(id, values);
    });
    const report = computeReport(answers);
    expect(report.trafficLightSummary?.total).toBe(targetTotal);
    expect(report.trafficLightSummary?.band).toBe(expectedBand);
  });

  it("is null when no stage has a traffic light (nothing answered)", () => {
    expect(computeReport([]).trafficLightSummary).toBeNull();
  });
});
