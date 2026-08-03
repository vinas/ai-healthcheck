import { notFound } from "next/navigation";
import AssessmentHeader from "@/components/healthcheck/assessment-header";
import StepIntroduction from "@/components/healthcheck/step-introduction";
import AssessmentFooter from "@/components/healthcheck/assessment-footer";
import { prisma } from "@/lib/prisma";
import { QuestionTypeId, StageId } from "@/lib/question-taxonomy";

const STAGE_INTRO_COPY: Record<StageId, string[]> = {
  [StageId.DemandDefinition]: [
    "This section looks at how AI supports turning business needs into clear, development-ready requirements — drafting, refining, and catching ambiguity before work begins.",
    "This is often one of the least mature areas, since it requires both business and engineering teams to adopt AI together, not just developers.",
  ],
  [StageId.ImplementationPlanning]: [
    "This section covers how AI supports technical design, task breakdown, and effort estimation before coding begins.",
  ],
  [StageId.ImplementationCoding]: [
    "This section covers how deeply AI is embedded in day-to-day coding work across your development team.",
  ],
  [StageId.Testing]: [
    "This section covers how AI generates, maintains, and integrates automated tests into your development workflow.",
  ],
  [StageId.PullRequestReview]: [
    "This section covers how consistently AI reviews code changes before they're merged, and how effective that review is at catching issues.",
  ],
  [StageId.DeploymentDelivery]: [
    "This section covers how AI supports release decisions, CI/CD automation, and deployment risk assessment.",
  ],
};

export default async function StageIntroPage({
  params,
}: {
  params: Promise<{ uniqueKey: string; stageId: string }>;
}) {
  const { uniqueKey, stageId: stageIdParam } = await params;
  const stageIdNum = Number(stageIdParam);

  const stage = Number.isInteger(stageIdNum)
    ? await prisma.stage.findUnique({ where: { id: stageIdNum } })
    : null;

  if (!stage) {
    notFound();
  }

  const paragraphs = STAGE_INTRO_COPY[stageIdNum as StageId];

  let backHref: string;
  if (stageIdNum === StageId.DemandDefinition) {
    backHref = `/healthcheck/stages/${uniqueKey}`;
  } else {
    const prevCount = await prisma.question.count({
      where: { stageId: stageIdNum - 1, isVisible: true },
    });
    backHref = `/healthcheck/stages/${uniqueKey}/${stageIdNum - 1}/${prevCount}`;
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AssessmentHeader activeStep={QuestionTypeId.Stages} />
      <div className="flex flex-col gap-8 px-8 py-6">
        <StepIntroduction heading={stage.label}>
          {paragraphs.map((paragraph, i) => (
            <p key={i} className="text-base text-foreground">
              {paragraph}
            </p>
          ))}
        </StepIntroduction>
      </div>
      <AssessmentFooter
        backHref={backHref}
        nextHref={`/healthcheck/stages/${uniqueKey}/${stageIdNum}/1`}
      />
    </main>
  );
}
