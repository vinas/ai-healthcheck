import AssessmentHeader from "@/components/healthcheck/assessment-header";
import StepIntroduction from "@/components/healthcheck/step-introduction";
import AssessmentFooter from "@/components/healthcheck/assessment-footer";
import { QuestionTypeId } from "@/lib/question-taxonomy";

export default async function ContextIntroPage({
  params,
}: {
  params: Promise<{ uniqueKey: string }>;
}) {
  const { uniqueKey } = await params;

  return (
    <>
      <AssessmentHeader activeStep={QuestionTypeId.Context} />
      <div className="flex flex-col gap-8 px-8 py-6">
        <StepIntroduction heading="About this section">
          <p className="text-base text-foreground">
            Before the assessment questions begin, we&apos;d like to know a bit
            about your organization — its size, industry, and how your teams
            currently work.
          </p>
          <p className="text-base text-foreground">
            These answers don&apos;t affect your score. They&apos;re used to
            calibrate the final report&apos;s benchmarks and recommendations to
            organizations similar to yours.
          </p>
          <p className="text-base text-foreground">
            This is typically best answered by a CTO, VP Engineering, or
            equivalent, since it covers organization-wide context rather
            than any single team&apos;s work.
          </p>
        </StepIntroduction>
      </div>
      <AssessmentFooter
        backHref={`/healthcheck/landing/${uniqueKey}`}
        nextHref={`/healthcheck/context/${uniqueKey}/1`}
      />
    </>
  );
}
