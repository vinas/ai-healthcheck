import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function isNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uniqueKey: string }> }
) {
  try {
    const { uniqueKey } = await params;

    const clientKey = await prisma.clientKey.findUnique({ where: { uniqueKey } });
    if (!clientKey) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
    }

    if (clientKey.keyUsedAt) {
      return NextResponse.json(
        { error: "This assessment has already been submitted." },
        { status: 409 }
      );
    }

    const body = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be an object mapping question id to option id." },
        { status: 400 }
      );
    }
    const answers = body as Record<string, unknown>;

    const questions = await prisma.question.findMany({
      where: { isVisible: true },
      select: { id: true, options: { select: { id: true } } },
    });

    const validOptionsByQuestion = new Map<number, Set<number>>(
      questions.map((q) => [q.id, new Set(q.options.map((o) => o.id))])
    );

    const missing = questions.map((q) => q.id).filter((id) => !(String(id) in answers));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing answers for question id(s): ${missing.join(", ")}.` },
        { status: 400 }
      );
    }

    const submittedIds = Object.keys(answers).map(Number);
    const unknownIds = submittedIds.filter((id) => !validOptionsByQuestion.has(id));
    if (unknownIds.length > 0) {
      return NextResponse.json(
        { error: `Unknown or hidden question id(s): ${unknownIds.join(", ")}.` },
        { status: 400 }
      );
    }

    for (const [questionIdStr, optionId] of Object.entries(answers)) {
      const questionId = Number(questionIdStr);
      if (typeof optionId !== "number" || !Number.isInteger(optionId)) {
        return NextResponse.json(
          { error: `Answer for question id ${questionId} must be an integer option id.` },
          { status: 400 }
        );
      }
      const validOptions = validOptionsByQuestion.get(questionId)!;
      if (!validOptions.has(optionId)) {
        return NextResponse.json(
          { error: `Option id ${optionId} does not belong to question id ${questionId}.` },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.answer.createMany({
        data: Object.entries(answers).map(([questionIdStr, optionId]) => ({
          clientKeyId: clientKey.id,
          questionId: Number(questionIdStr),
          optionId: optionId as number,
        })),
      });

      await tx.clientKey.update({
        where: { id: clientKey.id },
        data: { keyUsedAt: new Date() },
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "This assessment has already been submitted." },
        { status: 409 }
      );
    }
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Error when trying to submit the assessment: ${message}` },
      { status: 500 }
    );
  }
}
