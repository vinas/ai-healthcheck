import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "../route";

const mockMessagesCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(function AnthropicMock() {
    return { messages: { create: mockMessagesCreate } };
  }),
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    clientKey: { findUnique: vi.fn() },
    answer: { findMany: vi.fn() },
    narrative: { upsert: vi.fn() },
  },
}));

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuestionTypeId } from "@/lib/question-taxonomy";

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockClientKeyFindUnique = prisma.clientKey.findUnique as ReturnType<typeof vi.fn>;
const mockAnswerFindMany = prisma.answer.findMany as ReturnType<typeof vi.fn>;
const mockNarrativeUpsert = prisma.narrative.upsert as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/narratives/abc-123/draft", {
    method: "POST",
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
    question: { question: "F1?", questionTypeId: QuestionTypeId.Foundation, stageId: null },
    option: { option: "Multiple tools", value: 2 },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(null);
  mockClientKeyFindUnique.mockResolvedValue(usedClientKey);
  mockAnswerFindMany.mockResolvedValue(rawAnswers);
  process.env.ANTHROPIC_API_KEY = "test-key";
});

describe("POST /api/narratives/[uniqueKey]/draft", () => {
  it("returns 401 when unauthenticated", async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const res = await POST(makeRequest({ target: "summary" }), makeParams());
    expect(res.status).toBe(401);
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });

  it("returns 404 when the client key doesn't exist", async () => {
    mockClientKeyFindUnique.mockResolvedValueOnce(null);

    const res = await POST(makeRequest({ target: "summary" }), makeParams());
    expect(res.status).toBe(404);
  });

  it("returns 409 when the assessment hasn't been completed yet", async () => {
    mockClientKeyFindUnique.mockResolvedValueOnce({ ...usedClientKey, keyUsedAt: null });

    const res = await POST(makeRequest({ target: "summary" }), makeParams());
    expect(res.status).toBe(409);
  });

  it("returns 400 on an invalid target", async () => {
    const res = await POST(makeRequest({ target: "not-a-real-target" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid draft target: not-a-real-target.");
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });

  it("returns 500 when ANTHROPIC_API_KEY is not configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const res = await POST(makeRequest({ target: "summary" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("AI drafting is not configured. Set ANTHROPIC_API_KEY on the server.");
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });

  it("returns { text } for a text target without passing any tools", async () => {
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "A solid draft summary." }],
    });

    const res = await POST(makeRequest({ target: "summary" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ text: "A solid draft summary." });
    const callArgs = mockMessagesCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-sonnet-5");
    expect(callArgs.tools).toBeUndefined();
  });

  it("returns { roadmap } for the roadmap target, forcing the tool choice", async () => {
    const items = [{ what: "Do X", why: "Because Y", effort: "Low" }];
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{ type: "tool_use", id: "t1", name: "propose_roadmap", input: { items } }],
    });

    const res = await POST(makeRequest({ target: "roadmap" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ roadmap: items });
    const callArgs = mockMessagesCreate.mock.calls[0][0];
    expect(callArgs.tool_choice).toEqual({ type: "tool", name: "propose_roadmap" });
    expect(callArgs.tools).toHaveLength(1);
  });

  it("returns 502 when the Anthropic call throws", async () => {
    mockMessagesCreate.mockRejectedValueOnce(new Error("rate limited"));

    const res = await POST(makeRequest({ target: "summary" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error).toBe("The AI draft request failed. Try again.");
  });

  it("returns 502 when the roadmap response has no tool_use block", async () => {
    mockMessagesCreate.mockResolvedValueOnce({ content: [{ type: "text", text: "oops" }] });

    const res = await POST(makeRequest({ target: "roadmap" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error).toBe("Received an unexpected response from the AI model.");
  });

  it("never persists anything — the draft endpoint only reads and generates", async () => {
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "A solid draft summary." }],
    });

    await POST(makeRequest({ target: "summary" }), makeParams());

    expect(mockNarrativeUpsert).not.toHaveBeenCalled();
  });
});
