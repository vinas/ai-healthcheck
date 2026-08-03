import { describe, it, expect } from "vitest";
import { computeCalibrationNotes, type ContextAnswer } from "../narrative-guidance";

function contextAnswers(overrides: Partial<Record<string, string>> = {}): ContextAnswer[] {
  return [
    {
      questionText:
        "How many software developers (including QA, DevOps, and related roles) does your organization employ?",
      optionText: overrides.teamSize ?? "10–49",
    },
    {
      questionText: "Which industry best describes your organization?",
      optionText: overrides.industry ?? "Technology",
    },
    {
      questionText:
        "Do you currently collect baseline engineering metrics (e.g., deployment frequency, lead time, defect rates)?",
      optionText: overrides.baselineMetrics ?? "Formal metrics for some teams",
    },
  ];
}

describe("computeCalibrationNotes", () => {
  it("returns no notes for an empty context answer set", () => {
    expect(computeCalibrationNotes([])).toEqual([]);
  });

  it("adds a team-size note for fewer than 10 developers", () => {
    const notes = computeCalibrationNotes(contextAnswers({ teamSize: "Fewer than 10" }));
    expect(notes.some((n) => n.includes("fewer than 10 developers"))).toBe(true);
  });

  it("adds a team-size note for 200+ developers (either bucket)", () => {
    const notes = computeCalibrationNotes(contextAnswers({ teamSize: "1,000 or more" }));
    expect(notes.some((n) => n.includes("200+ developers"))).toBe(true);
  });

  it("adds a regulated-industry note for Financial services", () => {
    const notes = computeCalibrationNotes(contextAnswers({ industry: "Financial services" }));
    expect(notes.some((n) => n.includes("Financial services") && n.includes("GDPR"))).toBe(true);
  });

  it("does not add a regulated-industry note for Technology", () => {
    const notes = computeCalibrationNotes(contextAnswers({ industry: "Technology" }));
    expect(notes.some((n) => n.includes("regulatory") || n.includes("GDPR"))).toBe(false);
  });

  it("adds a no-baseline-metrics note when C5 is 'No metrics collected'", () => {
    const notes = computeCalibrationNotes(contextAnswers({ baselineMetrics: "No metrics collected" }));
    expect(notes.some((n) => n.includes("baseline engineering metrics are in place"))).toBe(true);
  });

  it("ignores unrelated question text", () => {
    const notes = computeCalibrationNotes([
      { questionText: "What is the primary driver for this AI assessment?", optionText: "Cost reduction" },
    ]);
    expect(notes).toEqual([]);
  });
});
