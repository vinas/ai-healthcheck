import AssessmentHeader from "@/components/healthcheck/assessment-header";
import AssessmentIntroduction from "@/components/healthcheck/assessment-introduction";
import AssessmentFooter from "@/components/healthcheck/assessment-footer";

export default async function AssessmentLandingPage({
  params,
}: {
  params: Promise<{ uniqueKey: string }>;
}) {
  const { uniqueKey } = await params;

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AssessmentHeader activeStep="introduction" />
      <div className="flex flex-col gap-8 px-8 py-6">
        <AssessmentIntroduction />
      </div>
      <AssessmentFooter nextHref={`/healthcheck/context/${uniqueKey}`} />
    </main>
  );
}
