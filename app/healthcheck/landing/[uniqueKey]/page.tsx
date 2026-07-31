import AssessmentHeader from "@/components/healthcheck/assessment-header";

export default function AssessmentLandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AssessmentHeader activeStep="introduction" />
    </main>
  );
}
