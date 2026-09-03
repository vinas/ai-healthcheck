import AssessmentHeader from "@/components/healthcheck/assessment-header";
import StepIntroduction from "@/components/healthcheck/step-introduction";
import AssessmentFooter from "@/components/healthcheck/assessment-footer";

export default async function AssessmentLandingPage({
  params,
}: {
  params: Promise<{ uniqueKey: string }>;
}) {
  const { uniqueKey } = await params;

  return (
    <>
      <AssessmentHeader activeStep="introduction" />
      <div className="flex flex-col gap-8 px-8 py-6">
        <StepIntroduction heading="Before you begin">
          <p className="text-base text-foreground">
            This assessment measures how deeply AI has been integrated into your
            organization&apos;s software development lifecycle — from requirements
            and planning through coding, testing, review, and deployment.
          </p>
          <p className="text-base text-foreground">
            You&apos;ll be guided through a short series of questions, one at a
            time. Once you&apos;re done, your answers will be used to generate a
            maturity assessment report highlighting your organization&apos;s
            strengths and areas for improvement.
          </p>
          <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            This is an assessment, not a test — there are no wrong answers.
            Please answer as honestly as you can; the accuracy of your report
            depends on it.
          </p>
        </StepIntroduction>
      </div>
      <AssessmentFooter nextHref={`/healthcheck/context/${uniqueKey}`} />
    </>
  );
}
