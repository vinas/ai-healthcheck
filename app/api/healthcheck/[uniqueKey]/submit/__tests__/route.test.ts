import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { POST } from "../route";

const mockTx = {
  answer: { createMany: vi.fn() },
  clientKey: { update: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    clientKey: { findUnique: vi.fn() },
    question: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";

const mockClientKeyFindUnique = prisma.clientKey.findUnique as ReturnType<typeof vi.fn>;
const mockQuestionFindMany = prisma.question.findMany as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/healthcheck/abc-123/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeParams(uniqueKey = "abc-123") {
  return { params: Promise.resolve({ uniqueKey }) };
}

const freshClientKey = { id: 1, uniqueKey: "abc-123", keyUsedAt: null };
const usedClientKey = { id: 2, uniqueKey: "abc-123", keyUsedAt: new Date("2026-08-01") };

const visibleQuestions = [
  { id: 1, options: [{ id: 10 }, { id: 11 }] },
  { id: 2, options: [{ id: 20 }, { id: 21 }] },
];

const validAnswers = { "1": 10, "2": 20 };

const notFoundError = new Prisma.PrismaClientKnownRequestError("Record not found", {
  code: "P2025",
  clientVersion: "5.19.1",
});

const uniqueConstraintError = new Prisma.PrismaClientKnownRequestError("Unique violation", {
  code: "P2002",
  clientVersion: "5.19.1",
});

beforeEach(() => {
  vi.clearAllMocks();
  mockClientKeyFindUnique.mockResolvedValue(freshClientKey);
  mockQuestionFindMany.mockResolvedValue(visibleQuestions);
  mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx));
});

describe("POST /api/healthcheck/[uniqueKey]/submit", () => {
  it("returns 200 and writes all answers plus keyUsedAt on success", async () => {
    const res = await POST(makeRequest(validAnswers), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mockTx.answer.createMany).toHaveBeenCalledWith({
      data: [
        { clientKeyId: 1, questionId: 1, optionId: 10 },
        { clientKeyId: 1, questionId: 2, optionId: 20 },
      ],
    });
    expect(mockTx.clientKey.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { keyUsedAt: expect.any(Date) },
    });
  });

  it("returns 404 when the uniqueKey doesn't match a ClientKey", async () => {
    mockClientKeyFindUnique.mockResolvedValueOnce(null);

    const res = await POST(makeRequest(validAnswers), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Assessment not found.");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 409 when the key has already been used", async () => {
    mockClientKeyFindUnique.mockResolvedValueOnce(usedClientKey);

    const res = await POST(makeRequest(validAnswers), makeParams());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("This assessment has already been submitted.");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is not a plain object", async () => {
    const res = await POST(makeRequest([1, 2, 3]), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Request body must be an object mapping question id to option id.");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 when a visible question has no answer", async () => {
    const res = await POST(makeRequest({ "1": 10 }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing answers for question id(s): 2.");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 when an answer references an unknown or hidden question id", async () => {
    const res = await POST(makeRequest({ ...validAnswers, "99": 10 }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Unknown or hidden question id(s): 99.");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 when an option does not belong to its question", async () => {
    const res = await POST(makeRequest({ "1": 20, "2": 20 }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Option id 20 does not belong to question id 1.");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 when an answer value is not an integer", async () => {
    const res = await POST(makeRequest({ "1": "ten", "2": 20 }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Answer for question id 1 must be an integer option id.");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 409 when a concurrent submission wins the race (P2002)", async () => {
    mockTransaction.mockRejectedValueOnce(uniqueConstraintError);

    const res = await POST(makeRequest(validAnswers), makeParams());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("This assessment has already been submitted.");
  });

  it("returns 404 if the ClientKey was deleted between lookup and transaction (P2025)", async () => {
    mockTransaction.mockRejectedValueOnce(notFoundError);

    const res = await POST(makeRequest(validAnswers), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Assessment not found.");
  });

  it("returns 500 when the database throws a generic error", async () => {
    mockTransaction.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await POST(makeRequest(validAnswers), makeParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe(
      "Error when trying to submit the assessment: Connection refused"
    );
  });
});
