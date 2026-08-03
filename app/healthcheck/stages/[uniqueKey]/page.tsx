import AssessmentHeader from "@/components/healthcheck/assessment-header";
import StepIntroduction from "@/components/healthcheck/step-introduction";
import AssessmentFooter from "@/components/healthcheck/assessment-footer";
import { prisma } from "@/lib/prisma";
import { QuestionTypeId, StageId } from "@/lib/question-taxonomy";

export default async function StagesIntroPage({
  params,
}: {
  params: Promise<{ uniqueKey: string }>;
}) {
  const { uniqueKey } = await params;

  const foundationQuestionCount = await prisma.question.count({
    where: { questionTypeId: QuestionTypeId.Foundation, isVisible: true },
  });

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AssessmentHeader activeStep={QuestionTypeId.Stages} />
      <div className="flex flex-col gap-8 px-8 py-6">
        <StepIntroduction heading="About this section">
          <p className="text-base text-foreground">
            This is the largest part of the assessment. It covers six stages
            of your software development lifecycle — from defining
            requirements through deployment — each assessed separately.
          </p>
          <p className="text-base text-foreground">
            You&apos;ll see a brief overview before each stage, followed by
            five quick questions about it.
          </p>
        </StepIntroduction>
      </div>
      <AssessmentFooter
        backHref={`/healthcheck/foundation/${uniqueKey}/${foundationQuestionCount}`}
        nextHref={`/healthcheck/stages/${uniqueKey}/${StageId.DemandDefinition}`}
      />
    </main>
  );
}
