import AssessmentHeader from "@/components/healthcheck/assessment-header";
import StepIntroduction from "@/components/healthcheck/step-introduction";
import AssessmentFooter from "@/components/healthcheck/assessment-footer";
import { prisma } from "@/lib/prisma";
import { QuestionTypeId, StageId } from "@/lib/question-taxonomy";

export default async function GovernanceIntroPage({
  params,
}: {
  params: Promise<{ uniqueKey: string }>;
}) {
  const { uniqueKey } = await params;

  const lastStageQuestionCount = await prisma.question.count({
    where: { stageId: StageId.DeploymentDelivery, isVisible: true },
  });

  return (
    <>
      <AssessmentHeader activeStep={QuestionTypeId.Governance} />
      <div className="flex flex-col gap-8 px-8 py-6">
        <StepIntroduction heading="About this section">
          <p className="text-base text-foreground">
            This final section looks at how responsibly AI adoption is being
            managed across your organization — ownership, data protection,
            and oversight — rather than any single stage of the development
            lifecycle.
          </p>
          <p className="text-base text-foreground">
            This is typically best answered by a CTO, VP Engineering, or
            Head of Security, since it covers organization-wide policy
            rather than day-to-day development work.
          </p>
        </StepIntroduction>
      </div>
      <AssessmentFooter
        backHref={`/healthcheck/stages/${uniqueKey}/${StageId.DeploymentDelivery}/${lastStageQuestionCount}`}
        nextHref={`/healthcheck/governance/${uniqueKey}/1`}
      />
    </>
  );
}
