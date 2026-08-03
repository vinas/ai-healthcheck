export type RoadmapItemPayload = { what: unknown; why: unknown; effort: unknown };

export type NarrativePayload = {
  executiveSummary: unknown;
  stageInterpretations: unknown;
  roadmap: unknown;
  benchmarkContext: unknown;
};

const VALID_STAGE_KEYS = new Set(["1", "2", "3", "4", "5", "6"]);
const VALID_EFFORTS = new Set(["Low", "Medium", "High"]);

export function validateNarrativePayload(payload: NarrativePayload): string | null {
  const { executiveSummary, stageInterpretations, roadmap, benchmarkContext } = payload;

  if (typeof executiveSummary !== "string") {
    return "executiveSummary must be a string.";
  }
  if (typeof benchmarkContext !== "string") {
    return "benchmarkContext must be a string.";
  }

  if (typeof stageInterpretations !== "object" || stageInterpretations === null || Array.isArray(stageInterpretations)) {
    return "stageInterpretations must be an object.";
  }
  for (const [key, value] of Object.entries(stageInterpretations)) {
    if (!VALID_STAGE_KEYS.has(key)) {
      return `stageInterpretations has an invalid stage id: ${key}.`;
    }
    if (typeof value !== "string") {
      return `stageInterpretations.${key} must be a string.`;
    }
  }

  if (!Array.isArray(roadmap)) {
    return "roadmap must be an array.";
  }
  for (const item of roadmap as RoadmapItemPayload[]) {
    if (typeof item !== "object" || item === null) {
      return "Each roadmap item must be an object.";
    }
    if (typeof item.what !== "string") {
      return "Each roadmap item needs a 'what' string.";
    }
    if (typeof item.why !== "string") {
      return "Each roadmap item needs a 'why' string.";
    }
    if (typeof item.effort !== "string" || !VALID_EFFORTS.has(item.effort)) {
      return "Each roadmap item's effort must be Low, Medium, or High.";
    }
  }

  return null;
}
