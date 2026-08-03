import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "../route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    clientKey: { findUnique: vi.fn() },
    narrative: { upsert: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const mockClientKeyFindUnique = prisma.clientKey.findUnique as ReturnType<typeof vi.fn>;
const mockNarrativeUpsert = prisma.narrative.upsert as ReturnType<typeof vi.fn>;
const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;

function makeRequest() {
  return new NextRequest("http://localhost/api/narratives/abc-123/publish", { method: "POST" });
}

function makeParams(uniqueKey = "abc-123") {
  return { params: Promise.resolve({ uniqueKey }) };
}

const usedClientKey = {
  id: 1,
  uniqueKey: "abc-123",
  keyUsedAt: new Date("2026-08-01"),
  narrative: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(null);
  mockClientKeyFindUnique.mockResolvedValue(usedClientKey);
});

describe("POST /api/narratives/[uniqueKey]/publish", () => {
  it("returns 401 when unauthenticated", async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(401);
    expect(mockNarrativeUpsert).not.toHaveBeenCalled();
  });

  it("returns 404 when the client key doesn't exist", async () => {
    mockClientKeyFindUnique.mockResolvedValueOnce(null);

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(404);
  });

  it("returns 409 when the assessment hasn't been completed yet", async () => {
    mockClientKeyFindUnique.mockResolvedValueOnce({ ...usedClientKey, keyUsedAt: null });

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(409);
  });

  it("creates and publishes a blank narrative when no row existed yet", async () => {
    mockNarrativeUpsert.mockResolvedValueOnce({
      clientKeyId: 1,
      executiveSummary: "",
      stageInterpretations: {},
      roadmap: [],
      benchmarkContext: "",
      publishedAt: new Date("2026-08-03"),
    });

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockNarrativeUpsert).toHaveBeenCalledWith({
      where: { clientKeyId: 1 },
      create: expect.objectContaining({ clientKeyId: 1, publishedAt: expect.any(Date) }),
      update: { publishedAt: expect.any(Date) },
    });
    expect(body.publishedAt).not.toBeNull();
  });

  it("sets publishedAt when a draft row exists but is unpublished", async () => {
    mockClientKeyFindUnique.mockResolvedValueOnce({
      ...usedClientKey,
      narrative: {
        executiveSummary: "Draft text",
        stageInterpretations: {},
        roadmap: [],
        benchmarkContext: "",
        publishedAt: null,
      },
    });
    mockNarrativeUpsert.mockResolvedValueOnce({
      executiveSummary: "Draft text",
      publishedAt: new Date("2026-08-03"),
    });

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(200);
    expect(mockNarrativeUpsert).toHaveBeenCalled();
  });

  it("is a no-op when the narrative is already published", async () => {
    const alreadyPublished = { executiveSummary: "x", publishedAt: new Date("2026-08-02") };
    mockClientKeyFindUnique.mockResolvedValueOnce({
      ...usedClientKey,
      narrative: alreadyPublished,
    });

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockNarrativeUpsert).not.toHaveBeenCalled();
    expect(body.publishedAt).toBe(alreadyPublished.publishedAt.toISOString());
  });
});
