import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeReport, type AnswerRecord, type Report } from "@/lib/scoring";
import { QuestionTypeId, StageId } from "@/lib/question-taxonomy";

export type ContextAnswer = { questionText: string; optionText: string };

export async function loadNarrativeContext(uniqueKey: string) {
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

  const report: Report = computeReport(answers);
  const contextAnswers: ContextAnswer[] = rawAnswers
    .filter((a) => a.question.questionTypeId === QuestionTypeId.Context)
    .map((a) => ({ questionText: a.question.question, optionText: a.option.option }));

  return { clientKey, report, contextAnswers };
}
