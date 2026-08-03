import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uniqueKey: string }> }
) {
  try {
    const unauthorized = await requireAuth();
    if (unauthorized) return unauthorized;

    const { uniqueKey } = await params;
    const clientKey = await prisma.clientKey.findUnique({
      where: { uniqueKey },
      include: { narrative: true },
    });
    if (!clientKey) {
      return NextResponse.json({ error: "Client key not found." }, { status: 404 });
    }
    if (!clientKey.keyUsedAt) {
      return NextResponse.json(
        { error: "This assessment hasn't been completed yet." },
        { status: 409 }
      );
    }

    if (clientKey.narrative?.publishedAt) {
      return NextResponse.json(clientKey.narrative, { status: 200 });
    }

    const narrative = await prisma.narrative.upsert({
      where: { clientKeyId: clientKey.id },
      create: {
        clientKeyId: clientKey.id,
        executiveSummary: "",
        stageInterpretations: {},
        roadmap: [],
        benchmarkContext: "",
        publishedAt: new Date(),
      },
      update: { publishedAt: new Date() },
    });

    return NextResponse.json(narrative, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Error when trying to publish the narrative: ${message}` },
      { status: 500 }
    );
  }
}
