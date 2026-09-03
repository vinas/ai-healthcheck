import { QuestionTypeId } from "@/lib/question-taxonomy";
import { getAssessmentQuestion } from "@/lib/assessment-question";
import AssessmentHeader from "@/components/healthcheck/assessment-header";
import QuestionStep from "@/components/healthcheck/question-step";

export default async function FoundationQuestionPage({
  params,
}: {
  params: Promise<{ uniqueKey: string; position: string }>;
}) {
  const { uniqueKey, position: positionParam } = await params;
  const position = Number(positionParam);

  const { question, total } = await getAssessmentQuestion(
    { questionTypeId: QuestionTypeId.Foundation, isVisible: true },
    position
  );

  const backHref =
    position === 1
      ? `/healthcheck/foundation/${uniqueKey}`
      : `/healthcheck/foundation/${uniqueKey}/${position - 1}`;
  const nextHref =
    position === total
      ? `/healthcheck/stages/${uniqueKey}`
      : `/healthcheck/foundation/${uniqueKey}/${position + 1}`;

  return (
    <>
      <AssessmentHeader activeStep={QuestionTypeId.Foundation} />
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
