import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateQuestionPayload } from "../validate-question";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    questionType: { findUnique: vi.fn() },
    stage: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

const mockQuestionTypeFindUnique = prisma.questionType.findUnique as ReturnType<typeof vi.fn>;
const mockStageFindUnique = prisma.stage.findUnique as ReturnType<typeof vi.fn>;

const nonStagesType = { id: 1, label: "Foundation" };
const stagesType = { id: 3, label: "Stages" };
const stage = { id: 2, label: "Testing" };

const validOptions = [
  { option: "Option A", value: 0 },
  { option: "Option B", value: 1 },
];

function basePayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    questionTypeId: 1,
    stageId: null,
    question: "Is this a valid question?",
    options: validOptions,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockQuestionTypeFindUnique.mockResolvedValue(nonStagesType);
});

describe("validateQuestionPayload", () => {
  it("returns null for a valid non-Stages payload", async () => {
    const result = await validateQuestionPayload(basePayload());
    expect(result).toBeNull();
  });

  it("returns null for a valid Stages payload with a stageId", async () => {
    mockQuestionTypeFindUnique.mockResolvedValueOnce(stagesType);
    mockStageFindUnique.mockResolvedValueOnce(stage);

    const result = await validateQuestionPayload(
      basePayload({ questionTypeId: 3, stageId: 2 })
    );
    expect(result).toBeNull();
  });

  it("rejects an empty question", async () => {
    const result = await validateQuestionPayload(basePayload({ question: "" }));
    expect(result).toBe("question is required.");
  });

  it("rejects a non-string question", async () => {
    const result = await validateQuestionPayload(basePayload({ question: null }));
    expect(result).toBe("question is required.");
  });

  it("rejects a question longer than 255 characters", async () => {
    const result = await validateQuestionPayload(basePayload({ question: "a".repeat(256) }));
    expect(result).toBe("question must be 255 characters or fewer.");
  });

  it("rejects a missing questionTypeId", async () => {
    const result = await validateQuestionPayload(basePayload({ questionTypeId: "1" }));
    expect(result).toBe("questionTypeId is required.");
  });

  it("rejects a questionTypeId that does not exist", async () => {
    mockQuestionTypeFindUnique.mockResolvedValueOnce(null);
    const result = await validateQuestionPayload(basePayload());
    expect(result).toBe("questionTypeId does not reference an existing question type.");
  });

  it("rejects a Stages question without a stageId", async () => {
    mockQuestionTypeFindUnique.mockResolvedValueOnce(stagesType);
    const result = await validateQuestionPayload(basePayload({ questionTypeId: 3 }));
    expect(result).toBe("stageId is required when question type is Stages.");
  });

  it("rejects a Stages question with a stageId that does not exist", async () => {
    mockQuestionTypeFindUnique.mockResolvedValueOnce(stagesType);
    mockStageFindUnique.mockResolvedValueOnce(null);
    const result = await validateQuestionPayload(basePayload({ questionTypeId: 3, stageId: 99 }));
    expect(result).toBe("stageId does not reference an existing stage.");
  });

  it("rejects a non-Stages question with a stageId set", async () => {
    const result = await validateQuestionPayload(basePayload({ stageId: 2 }));
    expect(result).toBe("stageId must not be set unless question type is Stages.");
  });

  it("rejects fewer than 2 options", async () => {
    const result = await validateQuestionPayload(basePayload({ options: [validOptions[0]] }));
    expect(result).toBe("At least 2 options are required.");
  });

  it("rejects a non-array options value", async () => {
    const result = await validateQuestionPayload(basePayload({ options: "not-an-array" }));
    expect(result).toBe("At least 2 options are required.");
  });

  it("rejects an option with empty text", async () => {
    const result = await validateQuestionPayload(
      basePayload({ options: [{ option: "", value: 0 }, { option: "B", value: 1 }] })
    );
    expect(result).toBe("Each option must have text.");
  });

  it("rejects an option with text longer than 255 characters", async () => {
    const result = await validateQuestionPayload(
      basePayload({
        options: [{ option: "a".repeat(256), value: 0 }, { option: "B", value: 1 }],
      })
    );
    expect(result).toBe("Option text must be 255 characters or fewer.");
  });

  it("rejects an option with a non-integer value", async () => {
    const result = await validateQuestionPayload(
      basePayload({ options: [{ option: "A", value: 1.5 }, { option: "B", value: 1 }] })
    );
    expect(result).toBe("Each option value must be an integer.");
  });
});
