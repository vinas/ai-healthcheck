import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE_NAME } from "@/lib/auth";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const recentFailures = await prisma.login.count({
      where: {
        email,
        success: false,
        date: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
      },
    });
    if (recentFailures >= RATE_LIMIT_MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many failed login attempts. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findFirst({ where: { email } });
    const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !passwordMatches) {
      await prisma.login.create({
        data: { email, success: false },
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await prisma.login.create({
      data: { email, success: true },
    });

    const token = await signToken({ id: user.id, email: user.email });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24h in seconds
    });

    const { password: _omitted, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
