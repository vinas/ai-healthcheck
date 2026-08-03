import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuestionTypeId, StageId } from "@/lib/question-taxonomy";
import AssessmentHeader from "@/components/healthcheck/assessment-header";
import QuestionStep from "@/components/healthcheck/question-step";

export default async function StageQuestionPage({
  params,
}: {
  params: Promise<{ uniqueKey: string; stageId: string; position: string }>;
}) {
  const { uniqueKey, stageId: stageIdParam, position: positionParam } = await params;
  const stageIdNum = Number(stageIdParam);
  const position = Number(positionParam);

  const stage = Number.isInteger(stageIdNum)
    ? await prisma.stage.findUnique({ where: { id: stageIdNum } })
    : null;

  if (!stage) {
    notFound();
  }

  const questions = await prisma.question.findMany({
    where: { stageId: stageIdNum, isVisible: true },
    orderBy: { id: "asc" },
    include: { options: { orderBy: { id: "asc" }, select: { id: true, option: true } } },
  });

  if (!Number.isInteger(position) || position < 1 || position > questions.length) {
    notFound();
  }

  const question = questions[position - 1];
  const backHref =
    position === 1
      ? `/healthcheck/stages/${uniqueKey}/${stageIdNum}`
      : `/healthcheck/stages/${uniqueKey}/${stageIdNum}/${position - 1}`;

  let nextHref: string;
  if (position < questions.length) {
    nextHref = `/healthcheck/stages/${uniqueKey}/${stageIdNum}/${position + 1}`;
  } else if (stageIdNum === StageId.DeploymentDelivery) {
    nextHref = `/healthcheck/governance/${uniqueKey}`;
  } else {
    nextHref = `/healthcheck/stages/${uniqueKey}/${stageIdNum + 1}`;
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AssessmentHeader activeStep={QuestionTypeId.Stages} />
      <QuestionStep
        uniqueKey={uniqueKey}
        question={question}
        position={position}
        total={questions.length}
        backHref={backHref}
        nextHref={nextHref}
        groupLabel={stage.label}
      />
    </main>
  );
}
