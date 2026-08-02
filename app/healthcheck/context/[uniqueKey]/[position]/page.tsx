import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuestionTypeId } from "@/lib/question-taxonomy";
import AssessmentHeader from "@/components/healthcheck/assessment-header";
import QuestionStep from "@/components/healthcheck/question-step";

export default async function ContextQuestionPage({
  params,
}: {
  params: Promise<{ uniqueKey: string; position: string }>;
}) {
  const { uniqueKey, position: positionParam } = await params;
  const position = Number(positionParam);

  const questions = await prisma.question.findMany({
    where: { questionTypeId: QuestionTypeId.Context, isVisible: true },
    orderBy: { id: "asc" },
    include: { options: { orderBy: { id: "asc" }, select: { id: true, option: true } } },
  });

  if (!Number.isInteger(position) || position < 1 || position > questions.length) {
    notFound();
  }

  const question = questions[position - 1];
  const backHref =
    position === 1
      ? `/healthcheck/context/${uniqueKey}`
      : `/healthcheck/context/${uniqueKey}/${position - 1}`;
  const nextHref =
    position === questions.length
      ? `/healthcheck/foundation/${uniqueKey}`
      : `/healthcheck/context/${uniqueKey}/${position + 1}`;

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AssessmentHeader activeStep={QuestionTypeId.Context} />
      <QuestionStep
        uniqueKey={uniqueKey}
        question={question}
        position={position}
        total={questions.length}
        backHref={backHref}
        nextHref={nextHref}
      />
    </main>
  );
}
