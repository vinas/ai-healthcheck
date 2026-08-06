import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AssessmentQuestion = Prisma.QuestionGetPayload<{
  include: {
    options: { select: { id: true; option: true } };
  };
}>;

export async function getAssessmentQuestion(
  where: Prisma.QuestionWhereInput,
  position: number
): Promise<{ question: AssessmentQuestion; total: number }> {
  const questions = await prisma.question.findMany({
    where,
    orderBy: { id: "asc" },
    include: {
      options: { orderBy: { id: "asc" }, select: { id: true, option: true } },
    },
  });

  if (!Number.isInteger(position) || position < 1 || position > questions.length) {
    notFound();
  }

  return { question: questions[position - 1], total: questions.length };
}

export async function getStageOrNotFound(stageIdParam: string) {
  const stageIdNum = Number(stageIdParam);
  const stage = Number.isInteger(stageIdNum)
    ? await prisma.stage.findUnique({ where: { id: stageIdNum } })
    : null;

  if (!stage) {
    notFound();
  }

  return { stageIdNum, stage };
}
