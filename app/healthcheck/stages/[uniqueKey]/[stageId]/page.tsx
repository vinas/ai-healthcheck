import AssessmentHeader from "@/components/healthcheck/assessment-header";
import StepIntroduction from "@/components/healthcheck/step-introduction";
import AssessmentFooter from "@/components/healthcheck/assessment-footer";
import { prisma } from "@/lib/prisma";
import { QuestionTypeId, StageId } from "@/lib/question-taxonomy";
import { getStageOrNotFound } from "@/lib/assessment-question";

const STAGE_INTRO_COPY: Record<StageId, string[]> = {
  [StageId.DemandDefinition]: [
    "This section looks at how AI supports turning business needs into clear, development-ready requirements — drafting, refining, and catching ambiguity before work begins.",
    "This is often one of the least mature areas, since it requires both business and engineering teams to adopt AI together, not just developers.",
    "This is typically best answered by a Product Manager or the Technical Lead closest to requirements work.",
  ],
  [StageId.ImplementationPlanning]: [
    "This section covers how AI supports technical design, task breakdown, and effort estimation before coding begins.",
    "This is typically best answered by a Senior Developer or Tech Lead.",
  ],
  [StageId.ImplementationCoding]: [
    "This section covers how deeply AI is embedded in day-to-day coding work across your development team.",
    "This is typically best answered by developers directly — for larger teams, consider having 2–3 developers weigh in.",
  ],
  [StageId.Testing]: [
    "This section covers how AI generates, maintains, and integrates automated tests into your development workflow.",
    "This is typically best answered by a QA Lead or the developer who owns your test strategy.",
  ],
  [StageId.PullRequestReview]: [
    "This section covers how consistently AI reviews code changes before they're merged, and how effective that review is at catching issues.",
    "This is typically best answered by a Senior Developer or Engineering Manager.",
  ],
  [StageId.DeploymentDelivery]: [
    "This section covers how AI supports release decisions, CI/CD automation, and deployment risk assessment.",
    "This is typically best answered by a DevOps, Platform, or Release Engineering Lead.",
  ],
};

export default async function StageIntroPage({
  params,
}: {
  params: Promise<{ uniqueKey: string; stageId: string }>;
}) {
  const { uniqueKey, stageId: stageIdParam } = await params;
  const { stageIdNum, stage } = await getStageOrNotFound(stageIdParam);

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
    <>
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
    </>
  );
}
