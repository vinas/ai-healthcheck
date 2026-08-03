import AssessmentHeader from "@/components/healthcheck/assessment-header";
import StepIntroduction from "@/components/healthcheck/step-introduction";
import AssessmentFooter from "@/components/healthcheck/assessment-footer";
import { prisma } from "@/lib/prisma";
import { QuestionTypeId } from "@/lib/question-taxonomy";

export default async function FoundationIntroPage({
  params,
}: {
  params: Promise<{ uniqueKey: string }>;
}) {
  const { uniqueKey } = await params;

  const contextQuestionCount = await prisma.question.count({
    where: { questionTypeId: QuestionTypeId.Context, isVisible: true },
  });

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AssessmentHeader activeStep={QuestionTypeId.Foundation} />
      <div className="flex flex-col gap-8 px-8 py-6">
        <StepIntroduction heading="About this section">
          <p className="text-base text-foreground">
            This section looks at the tooling, integrations, and governance
            your organization has in place to support AI adoption — the
            tools available to your team, how well they connect to your
            existing systems, and whether clear policies guide their use.
          </p>
          <p className="text-base text-foreground">
            Unlike the previous section, these answers do contribute to
            your report&apos;s score. They help us understand how ready your
            organization&apos;s foundation is to support meaningful AI
            adoption across the rest of your development process.
          </p>
          <p className="text-base text-foreground">
            This is typically best answered by an Engineering Manager or
            DevOps/Platform Lead, since it covers tooling and infrastructure
            decisions rather than day-to-day development work.
          </p>
        </StepIntroduction>
      </div>
      <AssessmentFooter
        backHref={`/healthcheck/context/${uniqueKey}/${contextQuestionCount}`}
        nextHref={`/healthcheck/foundation/${uniqueKey}/1`}
      />
    </main>
  );
}
