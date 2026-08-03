import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "../route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const mockCreate = prisma.client.create as ReturnType<typeof vi.fn>;
const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: "Acme Corp",
  contactPersonName: "John Doe",
  contactPersonEmail: "john@acme.com",
  contactPersonPhone: "+1234567890",
};

const createdClient = {
  id: 1,
  name: "Acme Corp",
  contactPersonName: "John Doe",
  contactPersonEmail: "john@acme.com",
  contactPersonPhone: "+1234567890",
  keys: [
    {
      id: 1,
      uniqueKey: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      keyUsedAt: null,
      createdAt: "2026-08-03T00:00:00.000Z",
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(null);
});

describe("POST /api/clients", () => {
  it("returns 200 with the created client when all fields are valid", async () => {
    mockCreate.mockResolvedValueOnce(createdClient);

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(createdClient);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        name: validBody.name,
        contactPersonName: validBody.contactPersonName,
        contactPersonEmail: validBody.contactPersonEmail,
        contactPersonPhone: validBody.contactPersonPhone,
        keys: { create: [{}] },
      },
      include: { keys: true },
    });
  });

  it("returns 400 when name is null", async () => {
    const res = await POST(makeRequest({ ...validBody, name: null }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(
      "Error when trying to create a new client: name is required."
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when name is an empty string", async () => {
    const res = await POST(makeRequest({ ...validBody, name: "" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(
      "Error when trying to create a new client: name is required."
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 500 when the database throws a connection error", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe(
      "Error when trying to create a new client: Connection refused"
    );
  });

  it("returns 401 when no auth token is present", async () => {
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
