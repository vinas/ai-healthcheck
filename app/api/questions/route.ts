import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { validateQuestionPayload, type OptionPayload } from "@/lib/validate-question";

const QUESTION_INCLUDE = {
  questionType: true,
  stage: true,
  options: { orderBy: { id: "asc" as const } },
};

export async function GET() {
  try {
    const unauthorized = await requireAuth();
    if (unauthorized) return unauthorized;

    const [questions, questionTypes, stages] = await prisma.$transaction([
      prisma.question.findMany({
        include: QUESTION_INCLUDE,
        orderBy: [{ questionTypeId: "asc" }, { id: "asc" }],
      }),
      prisma.questionType.findMany({ orderBy: { id: "asc" } }),
      prisma.stage.findMany({ orderBy: { id: "asc" } }),
    ]);

    return NextResponse.json({ questions, questionTypes, stages }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const unauthorized = await requireAuth();
    if (unauthorized) return unauthorized;

    const body = await req.json();
    const validationError = await validateQuestionPayload(body);
    if (validationError) {
      return NextResponse.json(
        { error: `Error when trying to create a new question: ${validationError}` },
        { status: 400 }
      );
    }

    const { questionTypeId, stageId, question, options } = body as {
      questionTypeId: number;
      stageId: number | null;
      question: string;
      options: OptionPayload[];
    };

    const questionType = await prisma.questionType.findUnique({
      where: { id: questionTypeId },
    });
    const finalStageId = questionType?.label === "Stages" ? stageId : null;

    const created = await prisma.question.create({
      data: {
        questionTypeId,
        stageId: finalStageId,
        question: question.trim(),
        options: {
          create: options.map((o) => ({
            option: (o.option as string).trim(),
            value: o.value as number,
          })),
        },
      },
      include: QUESTION_INCLUDE,
    });

    return NextResponse.json(created, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Error when trying to create a new question: ${message}` },
      { status: 500 }
    );
  }
}
