import { QuestionTypeId } from "@/lib/question-taxonomy";
import { getAssessmentQuestion } from "@/lib/assessment-question";
import AssessmentHeader from "@/components/healthcheck/assessment-header";
import QuestionStep from "@/components/healthcheck/question-step";

export default async function GovernanceQuestionPage({
  params,
}: {
  params: Promise<{ uniqueKey: string; position: string }>;
}) {
  const { uniqueKey, position: positionParam } = await params;
  const position = Number(positionParam);

  const { question, total } = await getAssessmentQuestion(
    { questionTypeId: QuestionTypeId.Governance, isVisible: true },
    position
  );

  const backHref =
    position === 1
      ? `/healthcheck/governance/${uniqueKey}`
      : `/healthcheck/governance/${uniqueKey}/${position - 1}`;
  const nextHref =
    position === total
      ? `/healthcheck/complete/${uniqueKey}`
      : `/healthcheck/governance/${uniqueKey}/${position + 1}`;

  return (
    <>
      <AssessmentHeader activeStep={QuestionTypeId.Governance} />
      <QuestionStep
        uniqueKey={uniqueKey}
        question={question}
        position={position}
        total={total}
        backHref={backHref}
        nextHref={nextHref}
      />
    </>
  );
}
