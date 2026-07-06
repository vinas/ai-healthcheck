import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const hashedPassword = createHash("sha256").update(password).digest("hex");

    const user = await prisma.user.findFirst({
      where: { email, password: hashedPassword },
    });

    if (!user) {
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
