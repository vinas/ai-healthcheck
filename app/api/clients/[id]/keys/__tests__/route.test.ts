import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "../route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: { findUnique: vi.fn() },
    clientKey: { create: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const mockClientFindUnique = prisma.client.findUnique as ReturnType<typeof vi.fn>;
const mockKeyCreate = prisma.clientKey.create as ReturnType<typeof vi.fn>;
const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;

function makeRequest() {
  return new NextRequest("http://localhost/api/clients/5/keys", { method: "POST" });
}

function makeParams(id = "5") {
  return { params: Promise.resolve({ id }) };
}

const existingClient = { id: 5, name: "Acme Corp" };
const createdKey = {
  id: 10,
  clientId: 5,
  uniqueKey: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  keyUsedAt: null,
  createdAt: "2026-08-03T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(null);
});

describe("POST /api/clients/[id]/keys", () => {
  it("returns 200 with the created key when the client exists", async () => {
    mockClientFindUnique.mockResolvedValueOnce(existingClient);
    mockKeyCreate.mockResolvedValueOnce(createdKey);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(createdKey);
    expect(mockKeyCreate).toHaveBeenCalledWith({ data: { clientId: 5 } });
  });

  it("returns 400 for an invalid client id", async () => {
    const res = await POST(makeRequest(), makeParams("not-a-number"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid client id.");
    expect(mockKeyCreate).not.toHaveBeenCalled();
  });

  it("returns 404 when the client does not exist", async () => {
    mockClientFindUnique.mockResolvedValueOnce(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Client not found.");
    expect(mockKeyCreate).not.toHaveBeenCalled();
  });

  it("returns 500 when the database throws", async () => {
    mockClientFindUnique.mockResolvedValueOnce(existingClient);
    mockKeyCreate.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe(
      "Error when trying to generate a new key: Connection refused"
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockKeyCreate).not.toHaveBeenCalled();
  });
});
