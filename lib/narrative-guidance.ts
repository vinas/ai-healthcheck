import { StageId } from "@/lib/question-taxonomy";

export type StageGuidance = { whatThisMeasures: string; note?: string };

export const STAGE_GUIDANCE: Record<StageId, StageGuidance> = {
  [StageId.DemandDefinition]: {
    whatThisMeasures:
      "How effectively AI is used to transform business needs into clear, development-ready requirements — requirement drafting, refinement, ambiguity detection, and stakeholder alignment.",
    note: "This stage is often the least mature: it requires both business stakeholders and developers to collaborate on AI use, a harder organizational change than developer-only tooling.",
  },
  [StageId.ImplementationPlanning]: {
    whatThisMeasures:
      "How effectively AI supports technical design, task decomposition, and effort estimation before coding begins.",
    note: "If you have an example AI-generated implementation plan, the quality of the prompt used often reveals more about maturity than the answer to any single question.",
  },
  [StageId.ImplementationCoding]: {
    whatThisMeasures:
      "How deeply AI is embedded in day-to-day coding activities across the development team — typically the most mature stage once an organization has started adopting AI.",
    note: "Clients frequently overstate adoption here because some developers are vocal about AI use while others avoid it entirely — prefer data over impressions when interpreting this stage.",
  },
  [StageId.Testing]: {
    whatThisMeasures:
      "How effectively AI generates, maintains, and integrates automated tests into the development workflow.",
  },
  [StageId.PullRequestReview]: {
    whatThisMeasures:
      "How consistently AI reviews code changes before they're merged, and how effective that review is at catching defects and enforcing standards.",
    note: "An example AI review comment and the developer's response to it quickly reveals whether AI review is meaningful or ignored.",
  },
  [StageId.DeploymentDelivery]: {
    whatThisMeasures:
      "How effectively AI supports release decisions, CI/CD pipeline automation, deployment risk assessment, and post-deployment reliability.",
    note: "This stage often has the highest business impact but the lowest adoption maturity of all six stages.",
  },
};

export const WRITING_GUIDELINES: string[] = [
  "Use the official level labels (Traditional, Experimental, AI-Assisted, AI-Enabled, AI-Optimized, AI-Native) when describing stages — avoid inventing new terminology.",
  "Don't attribute specific metrics or percentages unless they came from the client's own answers.",
  'Frame gaps constructively — e.g. "This stage is at Level 1.8 (Experimental) — the next step is formalizing tool availability and encouraging broader team adoption" rather than describing it as a low score.',
];

export const ROADMAP_GUIDANCE: string[] = [
  "Aim for 3–5 prioritized recommendations, drawn from the lowest-scoring stages, any triggered flags, and the context calibration notes below.",
  "Always pair a what to do with a why it matters to the business — avoid purely technical recommendations without a business outcome.",
];

export const BENCHMARK_GUIDANCE =
  "Apply context calibration to frame scores relative to this organization's size and industry. Don't cite specific competitors or external benchmarks unless independently verified.";

export type ContextAnswer = { questionText: string; optionText: string };

function findAnswer(contextAnswers: ContextAnswer[], match: string): string | null {
  const found = contextAnswers.find((a) => a.questionText.toLowerCase().includes(match));
  return found ? found.optionText : null;
}

export function computeCalibrationNotes(contextAnswers: ContextAnswer[]): string[] {
  const notes: string[] = [];

  const teamSize = findAnswer(contextAnswers, "how many software developers");
  if (teamSize === "Fewer than 10") {
    notes.push(
      'Team size (fewer than 10 developers): Overall Level 2.0 is a strong result here ("top quartile for organizations your size"); Level 3+ is exceptional. Avoid recommending governance structures that require dedicated roles.'
    );
  } else if (teamSize === "10–49") {
    notes.push(
      "Team size (10–49 developers): Overall Level 2.0–2.5 is typical; Level 3+ is leading. Governance recommendations should focus on lightweight policies rather than formal bodies."
    );
  } else if (teamSize === "50–199") {
    notes.push(
      "Team size (50–199 developers): Level 2.0–3.0 is expected; Level 3+ is strong. Governance should include a designated owner, with tooling standardization as the primary lever."
    );
  } else if (teamSize === "200–999" || teamSize === "1,000 or more") {
    notes.push(
      "Team size (200+ developers): Level 1.5–2.5 is typical; Level 3+ is strong. Formal governance bodies, approval processes, and measurement programs should be expected."
    );
  }

  const industry = findAnswer(contextAnswers, "which industry");
  if (industry === "Financial services" || industry === "Healthcare & life sciences") {
    notes.push(
      `Industry (${industry}): emphasize governance gaps in every recommendation, and note relevant regulatory obligations (e.g. GDPR, HIPAA, SOC2) alongside maturity observations.`
    );
  }

  const baselineMetrics = findAnswer(contextAnswers, "baseline engineering metrics");
  if (baselineMetrics === "No metrics collected") {
    notes.push(
      "No baseline engineering metrics are in place: consider noting that AI impact can't be measured or demonstrated without them, and that establishing metrics is a good first step regardless of maturity level."
    );
  }

  return notes;
}
