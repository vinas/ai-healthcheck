import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { validateQuestionPayload, type OptionPayload } from "@/lib/validate-question";

const QUESTION_INCLUDE = {
  questionType: true,
  stage: true,
  options: { orderBy: { id: "asc" as const } },
};

function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"
  );
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unauthorized = await requireAuth();
    if (unauthorized) return unauthorized;

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid question id." }, { status: 400 });
    }

    const body = await req.json();
    const validationError = await validateQuestionPayload(body);
    if (validationError) {
      return NextResponse.json(
        { error: `Error when trying to update the question: ${validationError}` },
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

    const existingOptions = await prisma.option.findMany({
      where: { questionId: id },
      select: { id: true },
    });
    const existingIds = new Set(existingOptions.map((o) => o.id));

    const incomingWithId = options.filter(
      (o): o is OptionPayload & { id: number } => o.id != null
    );
    const incomingIds = incomingWithId.map((o) => o.id);

    if (new Set(incomingIds).size !== incomingIds.length) {
      return NextResponse.json(
        { error: "Error when trying to update the question: duplicate option id submitted." },
        { status: 400 }
      );
    }
    const foreignOption = incomingWithId.find((o) => !existingIds.has(o.id));
    if (foreignOption) {
      return NextResponse.json(
        {
          error: `Error when trying to update the question: option id ${foreignOption.id} does not belong to this question.`,
        },
        { status: 400 }
      );
    }

    const idsToDelete = [...existingIds].filter((existingId) => !incomingIds.includes(existingId));
    const toCreate = options.filter((o) => o.id == null);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { id },
        data: { questionTypeId, stageId: finalStageId, question: question.trim() },
      });

      if (idsToDelete.length > 0) {
        await tx.option.deleteMany({ where: { id: { in: idsToDelete }, questionId: id } });
      }

      for (const o of incomingWithId) {
        await tx.option.update({
          where: { id: o.id },
          data: { option: (o.option as string).trim(), value: o.value as number },
        });
      }

      if (toCreate.length > 0) {
        await tx.option.createMany({
          data: toCreate.map((o) => ({
            questionId: id,
            option: (o.option as string).trim(),
            value: o.value as number,
          })),
        });
      }

      return tx.question.findUniqueOrThrow({ where: { id }, include: QUESTION_INCLUDE });
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Error when trying to update the question: ${message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unauthorized = await requireAuth();
    if (unauthorized) return unauthorized;

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid question id." }, { status: 400 });
    }

    const { isVisible } = await req.json();
    if (typeof isVisible !== "boolean") {
      return NextResponse.json(
        { error: "Error when trying to update question visibility: isVisible must be a boolean." },
        { status: 400 }
      );
    }

    const question = await prisma.question.update({
      where: { id },
      data: { isVisible },
      include: QUESTION_INCLUDE,
    });

    return NextResponse.json(question, { status: 200 });
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Error when trying to update question visibility: ${message}` },
      { status: 500 }
    );
  }
}
