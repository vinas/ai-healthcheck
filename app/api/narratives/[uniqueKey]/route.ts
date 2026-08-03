import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { validateNarrativePayload, type NarrativePayload } from "@/lib/validate-narrative";
import { computeReport, type AnswerRecord } from "@/lib/scoring";
import { QuestionTypeId, StageId } from "@/lib/question-taxonomy";

async function loadClientKey(uniqueKey: string) {
  const clientKey = await prisma.clientKey.findUnique({
    where: { uniqueKey },
    include: { client: { select: { id: true, name: true } }, narrative: true },
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
  return clientKey;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uniqueKey: string }> }
) {
  try {
    const unauthorized = await requireAuth();
    if (unauthorized) return unauthorized;

    const { uniqueKey } = await params;
    const clientKey = await loadClientKey(uniqueKey);
    if (clientKey instanceof NextResponse) return clientKey;

    const rawAnswers = await prisma.answer.findMany({
      where: { clientKeyId: clientKey.id, question: { isVisible: true } },
      include: {
        question: { select: { question: true, questionTypeId: true, stageId: true } },
        option: { select: { option: true, value: true } },
      },
    });

    const answers: AnswerRecord[] = rawAnswers.map((a) => ({
      questionTypeId: a.question.questionTypeId as QuestionTypeId,
      stageId: a.question.stageId as StageId | null,
      questionText: a.question.question,
      optionText: a.option.option,
      value: a.option.value,
    }));

    const report = computeReport(answers);
    const contextAnswers = rawAnswers
      .filter((a) => a.question.questionTypeId === QuestionTypeId.Context)
      .map((a) => ({ questionText: a.question.question, optionText: a.option.option }));

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
    const clientKey = await loadClientKey(uniqueKey);
    if (clientKey instanceof NextResponse) return clientKey;

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
