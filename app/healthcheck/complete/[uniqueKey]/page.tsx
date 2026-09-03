import { prisma } from "@/lib/prisma";
import { QuestionTypeId } from "@/lib/question-taxonomy";
import AssessmentHeader from "@/components/healthcheck/assessment-header";
import CompletionStatus from "@/components/healthcheck/completion-status";

export default async function CompletePage({
  params,
}: {
  params: Promise<{ uniqueKey: string }>;
}) {
  const { uniqueKey } = await params;

  const governanceQuestionCount = await prisma.question.count({
    where: { questionTypeId: QuestionTypeId.Governance, isVisible: true },
  });

  return (
    <>
      <AssessmentHeader activeStep={QuestionTypeId.Governance} />
      <CompletionStatus
        uniqueKey={uniqueKey}
        backHref={`/healthcheck/governance/${uniqueKey}/${governanceQuestionCount}`}
      />
    </>
  );
}
