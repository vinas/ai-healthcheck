import { QuestionTypeId } from "@/lib/question-taxonomy";
import { getAssessmentQuestion } from "@/lib/assessment-question";
import AssessmentHeader from "@/components/healthcheck/assessment-header";
import QuestionStep from "@/components/healthcheck/question-step";

export default async function ContextQuestionPage({
  params,
}: {
  params: Promise<{ uniqueKey: string; position: string }>;
}) {
  const { uniqueKey, position: positionParam } = await params;
  const position = Number(positionParam);

  const { question, total } = await getAssessmentQuestion(
    { questionTypeId: QuestionTypeId.Context, isVisible: true },
    position
  );

  const backHref =
    position === 1
      ? `/healthcheck/context/${uniqueKey}`
      : `/healthcheck/context/${uniqueKey}/${position - 1}`;
  const nextHref =
    position === total
      ? `/healthcheck/foundation/${uniqueKey}`
      : `/healthcheck/context/${uniqueKey}/${position + 1}`;

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AssessmentHeader activeStep={QuestionTypeId.Context} />
      <QuestionStep
        uniqueKey={uniqueKey}
        question={question}
        position={position}
        total={total}
        backHref={backHref}
        nextHref={nextHref}
      />
    </main>
  );
}
