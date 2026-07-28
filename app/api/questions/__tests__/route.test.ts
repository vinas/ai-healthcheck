import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET, POST } from "../route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    question: { findMany: vi.fn(), create: vi.fn() },
    questionType: { findMany: vi.fn(), findUnique: vi.fn() },
    stage: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;
const mockCreate = prisma.question.create as ReturnType<typeof vi.fn>;
const mockQuestionTypeFindUnique = prisma.questionType.findUnique as ReturnType<typeof vi.fn>;
const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;

function makeRequest(body?: unknown) {
  return new NextRequest("http://localhost/api/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const nonStagesType = { id: 1, label: "Foundation" };

const validBody = {
  questionTypeId: 1,
  stageId: null,
  question: "Is this a valid question?",
  options: [
    { option: "Option A", value: 0 },
    { option: "Option B", value: 1 },
  ],
};

const createdQuestion = {
  id: 10,
  questionTypeId: 1,
  stageId: null,
  question: "Is this a valid question?",
  isVisible: true,
  questionType: nonStagesType,
  stage: null,
  options: [
    { id: 1, option: "Option A", value: 0 },
    { id: 2, option: "Option B", value: 1 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(null);
  mockQuestionTypeFindUnique.mockResolvedValue(nonStagesType);
});

describe("GET /api/questions", () => {
  it("returns 200 with questions, questionTypes, and stages", async () => {
    const payload = [[createdQuestion], [nonStagesType], []];
    mockTransaction.mockResolvedValueOnce(payload);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      questions: [createdQuestion],
      questionTypes: [nonStagesType],
      stages: [],
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 500 when the database throws", async () => {
    mockTransaction.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Connection refused");
  });
});

describe("POST /api/questions", () => {
  it("returns 200 with the created question", async () => {
    mockCreate.mockResolvedValueOnce(createdQuestion);

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(createdQuestion);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("returns 400 when question is empty", async () => {
    const res = await POST(makeRequest({ ...validBody, question: "" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(
      "Error when trying to create a new question: question is required."
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when question is longer than 255 characters", async () => {
    const res = await POST(makeRequest({ ...validBody, question: "a".repeat(256) }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(
      "Error when trying to create a new question: question must be 255 characters or fewer."
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when questionTypeId does not reference an existing type", async () => {
    mockQuestionTypeFindUnique.mockResolvedValueOnce(null);

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(
      "Error when trying to create a new question: questionTypeId does not reference an existing question type."
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when a Stages question is missing stageId", async () => {
    mockQuestionTypeFindUnique.mockResolvedValueOnce({ id: 3, label: "Stages" });

    const res = await POST(makeRequest({ ...validBody, questionTypeId: 3 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(
      "Error when trying to create a new question: stageId is required when question type is Stages."
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when a non-Stages question has a stageId set", async () => {
    const res = await POST(makeRequest({ ...validBody, stageId: 2 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(
      "Error when trying to create a new question: stageId must not be set unless question type is Stages."
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when fewer than 2 options are submitted", async () => {
    const res = await POST(makeRequest({ ...validBody, options: [validBody.options[0]] }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(
      "Error when trying to create a new question: At least 2 options are required."
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when an option has empty text", async () => {
    const res = await POST(
      makeRequest({ ...validBody, options: [{ option: "", value: 0 }, { option: "B", value: 1 }] })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(
      "Error when trying to create a new question: Each option must have text."
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when an option value is not an integer", async () => {
    const res = await POST(
      makeRequest({ ...validBody, options: [{ option: "A", value: 1.5 }, { option: "B", value: 1 }] })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(
      "Error when trying to create a new question: Each option value must be an integer."
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 500 when the database throws", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe(
      "Error when trying to create a new question: Connection refused"
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
