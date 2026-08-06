import { QuestionTypeId, StageId } from "@/lib/question-taxonomy";
import { getAssessmentQuestion, getStageOrNotFound } from "@/lib/assessment-question";
import AssessmentHeader from "@/components/healthcheck/assessment-header";
import QuestionStep from "@/components/healthcheck/question-step";

export default async function StageQuestionPage({
  params,
}: {
  params: Promise<{ uniqueKey: string; stageId: string; position: string }>;
}) {
  const { uniqueKey, stageId: stageIdParam, position: positionParam } = await params;
  const position = Number(positionParam);

  const { stageIdNum, stage } = await getStageOrNotFound(stageIdParam);
  const { question, total } = await getAssessmentQuestion(
    { stageId: stageIdNum, isVisible: true },
    position
  );

  const backHref =
    position === 1
      ? `/healthcheck/stages/${uniqueKey}/${stageIdNum}`
      : `/healthcheck/stages/${uniqueKey}/${stageIdNum}/${position - 1}`;

  let nextHref: string;
  if (position < total) {
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
        total={total}
        backHref={backHref}
        nextHref={nextHref}
        groupLabel={stage.label}
      />
    </main>
  );
}
