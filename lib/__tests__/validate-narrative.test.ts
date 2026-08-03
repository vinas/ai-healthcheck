import { describe, it, expect } from "vitest";
import { validateNarrativePayload, type NarrativePayload } from "../validate-narrative";

function basePayload(overrides: Partial<NarrativePayload> = {}): NarrativePayload {
  return {
    executiveSummary: "Overall adoption is solid.",
    stageInterpretations: { "1": "Good progress here.", "3": "" },
    roadmap: [{ what: "Adopt AI review", why: "Reduces defects", effort: "Medium" }],
    benchmarkContext: "In line with peers of this size.",
    ...overrides,
  };
}

describe("validateNarrativePayload", () => {
  it("accepts a fully populated valid payload", () => {
    expect(validateNarrativePayload(basePayload())).toBeNull();
  });

  it("accepts an all-empty draft payload", () => {
    expect(
      validateNarrativePayload({
        executiveSummary: "",
        stageInterpretations: {},
        roadmap: [],
        benchmarkContext: "",
      })
    ).toBeNull();
  });

  it("rejects a non-string executiveSummary", () => {
    expect(validateNarrativePayload(basePayload({ executiveSummary: 42 }))).toBe(
      "executiveSummary must be a string."
    );
  });

  it("rejects a non-string benchmarkContext", () => {
    expect(validateNarrativePayload(basePayload({ benchmarkContext: null }))).toBe(
      "benchmarkContext must be a string."
    );
  });

  it("rejects a non-object stageInterpretations", () => {
    expect(validateNarrativePayload(basePayload({ stageInterpretations: ["a"] }))).toBe(
      "stageInterpretations must be an object."
    );
  });

  it("rejects an invalid stage key", () => {
    expect(
      validateNarrativePayload(basePayload({ stageInterpretations: { "7": "text" } }))
    ).toBe("stageInterpretations has an invalid stage id: 7.");
  });

  it("rejects a non-string stageInterpretations value", () => {
    expect(
      validateNarrativePayload(basePayload({ stageInterpretations: { "1": 5 } }))
    ).toBe("stageInterpretations.1 must be a string.");
  });

  it("rejects a non-array roadmap", () => {
    expect(validateNarrativePayload(basePayload({ roadmap: {} }))).toBe(
      "roadmap must be an array."
    );
  });

  it("rejects a roadmap item missing 'what'", () => {
    expect(
      validateNarrativePayload(
        basePayload({ roadmap: [{ why: "because", effort: "Low" }] })
      )
    ).toBe("Each roadmap item needs a 'what' string.");
  });

  it("rejects a roadmap item missing 'why'", () => {
    expect(
      validateNarrativePayload(
        basePayload({ roadmap: [{ what: "Do it", effort: "Low" }] })
      )
    ).toBe("Each roadmap item needs a 'why' string.");
  });

  it("rejects an invalid effort value", () => {
    expect(
      validateNarrativePayload(
        basePayload({ roadmap: [{ what: "Do it", why: "because", effort: "low" }] })
      )
    ).toBe("Each roadmap item's effort must be Low, Medium, or High.");
  });
});
