import AssessmentHeader from "@/components/healthcheck/assessment-header";
import AssessmentIntroduction from "@/components/healthcheck/assessment-introduction";

export default function AssessmentLandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AssessmentHeader activeStep="introduction" />
      <div className="flex flex-col gap-8 px-8 py-6">
        <AssessmentIntroduction />
      </div>
    </main>
  );
}
