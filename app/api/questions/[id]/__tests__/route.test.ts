import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { PUT, PATCH } from "../route";
import { QuestionTypeId } from "@/lib/question-taxonomy";

const mockTx = {
  question: { update: vi.fn(), findUniqueOrThrow: vi.fn() },
  option: { deleteMany: vi.fn(), update: vi.fn(), createMany: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    question: { update: vi.fn() },
    option: { findMany: vi.fn() },
    questionType: { findUnique: vi.fn() },
    stage: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;
const mockQuestionUpdate = prisma.question.update as ReturnType<typeof vi.fn>;
const mockOptionFindMany = prisma.option.findMany as ReturnType<typeof vi.fn>;
const mockQuestionTypeFindUnique = prisma.questionType.findUnique as ReturnType<typeof vi.fn>;
const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;

function makeRequest(method: "PUT" | "PATCH", body?: unknown) {
  return new NextRequest("http://localhost/api/questions/5", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function makeParams(id = "5") {
  return { params: Promise.resolve({ id }) };
}

const nonStagesType = { id: QuestionTypeId.Foundation, label: "Foundation" };

const notFoundError = new Prisma.PrismaClientKnownRequestError("Record not found", {
  code: "P2025",
  clientVersion: "5.19.1",
});

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(null);
  mockQuestionTypeFindUnique.mockResolvedValue(nonStagesType);
  mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx));
});

describe("PUT /api/questions/[id]", () => {
  const validBody = {
    questionTypeId: QuestionTypeId.Foundation,
    stageId: null,
    question: "Updated question?",
    options: [
      { id: 1, option: "Updated A", value: 5 },
      { option: "New C", value: 2 },
    ],
  };

  it("updates the question and diffs options: kept id updated, missing id deleted, new option created", async () => {
    mockOptionFindMany.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
    mockTx.question.findUniqueOrThrow.mockResolvedValueOnce({
      id: 5,
      questionTypeId: QuestionTypeId.Foundation,
      stageId: null,
      question: "Updated question?",
      isVisible: true,
      questionType: nonStagesType,
      stage: null,
      options: [
        { id: 1, option: "Updated A", value: 5 },
        { id: 3, option: "New C", value: 2 },
      ],
    });

    const res = await PUT(makeRequest("PUT", validBody), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.options).toEqual([
      { id: 1, option: "Updated A", value: 5 },
      { id: 3, option: "New C", value: 2 },
    ]);

    expect(mockTx.question.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { questionTypeId: QuestionTypeId.Foundation, stageId: null, question: "Updated question?" },
    });
    expect(mockTx.option.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [2] }, questionId: 5 },
    });
    expect(mockTx.option.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { option: "Updated A", value: 5 },
    });
    expect(mockTx.option.createMany).toHaveBeenCalledWith({
      data: [{ questionId: 5, option: "New C", value: 2 }],
    });
  });

  it("does not call deleteMany when no options are removed", async () => {
    mockOptionFindMany.mockResolvedValueOnce([{ id: 1 }]);
    mockTx.question.findUniqueOrThrow.mockResolvedValueOnce({});

    await PUT(
      makeRequest("PUT", {
        ...validBody,
        options: [{ id: 1, option: "Updated A", value: 5 }, { option: "New C", value: 2 }],
      }),
      makeParams()
    );

    expect(mockTx.option.deleteMany).not.toHaveBeenCalled();
  });

  it("returns 400 when a duplicate option id is submitted", async () => {
    mockOptionFindMany.mockResolvedValueOnce([{ id: 1 }]);

    const res = await PUT(
      makeRequest("PUT", {
        ...validBody,
        options: [
          { id: 1, option: "A", value: 0 },
          { id: 1, option: "B", value: 1 },
        ],
      }),
      makeParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("duplicate option id");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 when an option id does not belong to this question", async () => {
    mockOptionFindMany.mockResolvedValueOnce([{ id: 1 }]);

    const res = await PUT(
      makeRequest("PUT", {
        ...validBody,
        options: [
          { id: 99, option: "A", value: 0 },
          { option: "B", value: 1 },
        ],
      }),
      makeParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("option id 99 does not belong to this question");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid question id in the URL", async () => {
    const res = await PUT(makeRequest("PUT", validBody), makeParams("not-a-number"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid question id.");
  });

  it("returns 400 when validation fails (fewer than 2 options)", async () => {
    const res = await PUT(
      makeRequest("PUT", { ...validBody, options: [validBody.options[0]] }),
      makeParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(
      "Error when trying to update the question: At least 2 options are required."
    );
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 404 when the question does not exist", async () => {
    mockOptionFindMany.mockResolvedValueOnce([{ id: 1 }]);
    mockTx.question.update.mockRejectedValueOnce(notFoundError);

    const res = await PUT(makeRequest("PUT", validBody), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Question not found.");
  });

  it("returns 500 when the database throws a generic error", async () => {
    mockOptionFindMany.mockResolvedValueOnce([{ id: 1 }]);
    mockTx.question.update.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await PUT(makeRequest("PUT", validBody), makeParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe(
      "Error when trying to update the question: Connection refused"
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const res = await PUT(makeRequest("PUT", validBody), makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/questions/[id]", () => {
  it("hides a visible question", async () => {
    mockQuestionUpdate.mockResolvedValueOnce({ id: 5, isVisible: false });

    const res = await PATCH(makeRequest("PATCH", { isVisible: false }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isVisible).toBe(false);
    expect(mockQuestionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 }, data: { isVisible: false } })
    );
  });

  it("restores a hidden question", async () => {
    mockQuestionUpdate.mockResolvedValueOnce({ id: 5, isVisible: true });

    const res = await PATCH(makeRequest("PATCH", { isVisible: true }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isVisible).toBe(true);
  });

  it("returns 400 when isVisible is not a boolean", async () => {
    const res = await PATCH(makeRequest("PATCH", { isVisible: "yes" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("isVisible must be a boolean");
    expect(mockQuestionUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when the question does not exist", async () => {
    mockQuestionUpdate.mockRejectedValueOnce(notFoundError);

    const res = await PATCH(makeRequest("PATCH", { isVisible: false }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Question not found.");
  });

  it("returns 500 when the database throws a generic error", async () => {
    mockQuestionUpdate.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await PATCH(makeRequest("PATCH", { isVisible: false }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe(
      "Error when trying to update question visibility: Connection refused"
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const res = await PATCH(makeRequest("PATCH", { isVisible: false }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockQuestionUpdate).not.toHaveBeenCalled();
  });
});
