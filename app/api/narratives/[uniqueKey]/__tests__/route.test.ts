import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET, PUT } from "../route";
import { QuestionTypeId } from "@/lib/question-taxonomy";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    clientKey: { findUnique: vi.fn() },
    answer: { findMany: vi.fn() },
    narrative: { upsert: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const mockClientKeyFindUnique = prisma.clientKey.findUnique as ReturnType<typeof vi.fn>;
const mockAnswerFindMany = prisma.answer.findMany as ReturnType<typeof vi.fn>;
const mockNarrativeUpsert = prisma.narrative.upsert as ReturnType<typeof vi.fn>;
const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;

function makeGetRequest() {
  return new NextRequest("http://localhost/api/narratives/abc-123");
}

function makePutRequest(body: unknown) {
  return new NextRequest("http://localhost/api/narratives/abc-123", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeParams(uniqueKey = "abc-123") {
  return { params: Promise.resolve({ uniqueKey }) };
}

const usedClientKey = {
  id: 1,
  uniqueKey: "abc-123",
  keyUsedAt: new Date("2026-08-01"),
  client: { id: 5, name: "Acme Corp" },
  narrative: null,
};

const rawAnswers = [
  {
    question: { question: "Team size?", questionTypeId: QuestionTypeId.Context, stageId: null },
    option: { option: "10-49", value: 0 },
  },
  {
    question: { question: "F1?", questionTypeId: QuestionTypeId.Foundation, stageId: null },
    option: { option: "Multiple tools", value: 2 },
  },
];

const validPayload = {
  executiveSummary: "Solid progress overall.",
  stageInterpretations: { "1": "Doing well." },
  roadmap: [{ what: "Adopt AI review", why: "Reduces defects", effort: "Medium" }],
  benchmarkContext: "In line with peers.",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(null);
  mockClientKeyFindUnique.mockResolvedValue(usedClientKey);
  mockAnswerFindMany.mockResolvedValue(rawAnswers);
});

describe("GET /api/narratives/[uniqueKey]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const res = await GET(makeGetRequest(), makeParams());
    expect(res.status).toBe(401);
    expect(mockClientKeyFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the client key doesn't exist", async () => {
    mockClientKeyFindUnique.mockResolvedValueOnce(null);

    const res = await GET(makeGetRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Client key not found.");
  });

  it("returns 409 when the assessment hasn't been completed yet", async () => {
    mockClientKeyFindUnique.mockResolvedValueOnce({ ...usedClientKey, keyUsedAt: null });

    const res = await GET(makeGetRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("This assessment hasn't been completed yet.");
  });

  it("returns narrative: null when no narrative row exists yet", async () => {
    const res = await GET(makeGetRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.narrative).toBeNull();
    expect(body.client).toEqual({ id: 5, name: "Acme Corp" });
  });

  it("returns the existing narrative row when present", async () => {
    mockClientKeyFindUnique.mockResolvedValueOnce({
      ...usedClientKey,
      narrative: { ...validPayload, publishedAt: null },
    });

    const res = await GET(makeGetRequest(), makeParams());
    const body = await res.json();

    expect(body.narrative.executiveSummary).toBe(validPayload.executiveSummary);
    expect(body.narrative.publishedAt).toBeNull();
  });

  it("filters contextAnswers to only Context-type answers", async () => {
    const res = await GET(makeGetRequest(), makeParams());
    const body = await res.json();

    expect(body.contextAnswers).toEqual([{ questionText: "Team size?", optionText: "10-49" }]);
  });

  it("includes a computed report built from all answers", async () => {
    const res = await GET(makeGetRequest(), makeParams());
    const body = await res.json();

    expect(body.report).toHaveProperty("stages");
    expect(body.report).toHaveProperty("foundation");
    expect(body.report.foundation.score).toBe(2);
  });
});

describe("PUT /api/narratives/[uniqueKey]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const res = await PUT(makePutRequest(validPayload), makeParams());
    expect(res.status).toBe(401);
    expect(mockNarrativeUpsert).not.toHaveBeenCalled();
  });

  it("returns 404 when the client key doesn't exist", async () => {
    mockClientKeyFindUnique.mockResolvedValueOnce(null);

    const res = await PUT(makePutRequest(validPayload), makeParams());
    expect(res.status).toBe(404);
  });

  it("returns 409 when the assessment hasn't been completed yet", async () => {
    mockClientKeyFindUnique.mockResolvedValueOnce({ ...usedClientKey, keyUsedAt: null });

    const res = await PUT(makePutRequest(validPayload), makeParams());
    expect(res.status).toBe(409);
  });

  it("returns 400 on an invalid payload", async () => {
    const res = await PUT(
      makePutRequest({ ...validPayload, roadmap: [{ what: "x", why: "y", effort: "urgent" }] }),
      makeParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("effort must be Low, Medium, or High");
    expect(mockNarrativeUpsert).not.toHaveBeenCalled();
  });

  it("upserts the narrative wholesale on success", async () => {
    mockNarrativeUpsert.mockResolvedValueOnce({ ...validPayload, publishedAt: null });

    const res = await PUT(makePutRequest(validPayload), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockNarrativeUpsert).toHaveBeenCalledWith({
      where: { clientKeyId: 1 },
      create: { clientKeyId: 1, ...validPayload },
      update: validPayload,
    });
    expect(body.executiveSummary).toBe(validPayload.executiveSummary);
  });
});
