import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await verifyToken(token);

    const { name, contactPersonName, contactPersonEmail, contactPersonPhone } =
      await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Error when trying to create a new client: name is required." },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: { name, contactPersonName, contactPersonEmail, contactPersonPhone },
    });

    return NextResponse.json(client, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Error when trying to create a new client: ${message}` },
      { status: 500 }
    );
  }
}
