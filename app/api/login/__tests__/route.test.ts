import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    login: { create: vi.fn(), count: vi.fn() },
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  signToken: vi.fn(),
  COOKIE_NAME: "auth-token",
}));

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}));

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

const mockFindFirst = prisma.user.findFirst as ReturnType<typeof vi.fn>;
const mockLoginCreate = prisma.login.create as ReturnType<typeof vi.fn>;
const mockLoginCount = prisma.login.count as ReturnType<typeof vi.fn>;
const mockCookies = cookies as ReturnType<typeof vi.fn>;
const mockSignToken = signToken as ReturnType<typeof vi.fn>;
const mockCompare = bcrypt.compare as ReturnType<typeof vi.fn>;

const mockCookieSet = vi.fn();

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = { email: "user@test.com", password: "secret" };

const foundUser = {
  id: 1,
  name: "Test User",
  email: "user@test.com",
  password: "$2a$10$hashedvalue",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCookies.mockResolvedValue({ set: mockCookieSet });
  mockSignToken.mockResolvedValue("signed-jwt-token");
  mockLoginCreate.mockResolvedValue({});
  mockLoginCount.mockResolvedValue(0);
});

describe("POST /api/login", () => {
  it("returns 200 with user data (excluding password) on successful login", async () => {
    mockFindFirst.mockResolvedValueOnce(foundUser);
    mockCompare.mockResolvedValueOnce(true);

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ id: 1, name: "Test User", email: "user@test.com" });
    expect(body.password).toBeUndefined();
    expect(mockFindFirst).toHaveBeenCalledWith({ where: { email: validBody.email } });
    expect(mockCompare).toHaveBeenCalledWith(validBody.password, foundUser.password);
    expect(mockCookieSet).toHaveBeenCalledOnce();
    expect(mockLoginCreate).toHaveBeenCalledWith({
      data: { email: validBody.email, success: true },
    });
  });

  it("returns 401 when the email does not match any user", async () => {
    mockFindFirst.mockResolvedValueOnce(null);

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Invalid credentials");
    expect(mockCompare).not.toHaveBeenCalled();
    expect(mockCookieSet).not.toHaveBeenCalled();
    expect(mockLoginCreate).toHaveBeenCalledWith({
      data: { email: validBody.email, success: false },
    });
  });

  it("returns 401 when the password does not match the stored hash", async () => {
    mockFindFirst.mockResolvedValueOnce(foundUser);
    mockCompare.mockResolvedValueOnce(false);

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Invalid credentials");
    expect(mockCookieSet).not.toHaveBeenCalled();
    expect(mockLoginCreate).toHaveBeenCalledWith({
      data: { email: validBody.email, success: false },
    });
  });

  it("returns 429 and skips the lookup when there have been 5+ recent failed attempts", async () => {
    mockLoginCount.mockResolvedValueOnce(5);

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Too many failed login attempts. Please try again in a few minutes.");
    expect(mockFindFirst).not.toHaveBeenCalled();
    expect(mockCompare).not.toHaveBeenCalled();
    expect(mockLoginCreate).not.toHaveBeenCalled();
  });
});
