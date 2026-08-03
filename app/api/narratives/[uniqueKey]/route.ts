import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { validateNarrativePayload, type NarrativePayload } from "@/lib/validate-narrative";
import { loadNarrativeContext } from "@/lib/narrative-lookup";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uniqueKey: string }> }
) {
  try {
    const unauthorized = await requireAuth();
    if (unauthorized) return unauthorized;

    const { uniqueKey } = await params;
    const context = await loadNarrativeContext(uniqueKey);
    if (context instanceof NextResponse) return context;
    const { clientKey, report, contextAnswers } = context;

    const narrative = clientKey.narrative
      ? {
          executiveSummary: clientKey.narrative.executiveSummary,
          stageInterpretations: clientKey.narrative.stageInterpretations,
          roadmap: clientKey.narrative.roadmap,
          benchmarkContext: clientKey.narrative.benchmarkContext,
          publishedAt: clientKey.narrative.publishedAt,
        }
      : null;

    return NextResponse.json({
      client: clientKey.client,
      uniqueKey: clientKey.uniqueKey,
      report,
      contextAnswers,
      narrative,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Error when trying to load the narrative: ${message}` },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ uniqueKey: string }> }
) {
  try {
    const unauthorized = await requireAuth();
    if (unauthorized) return unauthorized;

    const { uniqueKey } = await params;
    const context = await loadNarrativeContext(uniqueKey);
    if (context instanceof NextResponse) return context;
    const { clientKey } = context;

    const body = (await req.json()) as NarrativePayload;
    const validationError = validateNarrativePayload(body);
    if (validationError) {
      return NextResponse.json(
        { error: `Error when trying to save the narrative: ${validationError}` },
        { status: 400 }
      );
    }

    const data = {
      executiveSummary: (body.executiveSummary as string).trim(),
      stageInterpretations: body.stageInterpretations as object,
      roadmap: body.roadmap as object,
      benchmarkContext: (body.benchmarkContext as string).trim(),
    };

    const narrative = await prisma.narrative.upsert({
      where: { clientKeyId: clientKey.id },
      create: { clientKeyId: clientKey.id, ...data },
      update: data,
    });

    return NextResponse.json(narrative, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Error when trying to save the narrative: ${message}` },
      { status: 500 }
    );
  }
}
