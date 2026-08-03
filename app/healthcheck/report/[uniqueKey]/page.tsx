import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { Sparkles, Map, Compass } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { computeReport, type AnswerRecord, type TrafficLight } from "@/lib/scoring";
import { QuestionTypeId, StageId } from "@/lib/question-taxonomy";

function trafficLightClasses(light: TrafficLight | null): string {
  switch (light) {
    case "RED":
      return "border-red-200 bg-red-50 text-red-900";
    case "YELLOW":
      return "border-yellow-200 bg-yellow-50 text-yellow-900";
    case "GREEN":
      return "border-green-200 bg-green-50 text-green-900";
    default:
      return "border-border bg-muted/30 text-muted-foreground";
  }
}

function formatLevel(level: number | null): string {
  return level == null ? "—" : level.toFixed(1);
}

function effortClasses(effort: string): string {
  switch (effort) {
    case "Low":
      return "border-green-200 bg-green-50 text-green-900";
    case "Medium":
      return "border-yellow-200 bg-yellow-50 text-yellow-900";
    case "High":
      return "border-red-200 bg-red-50 text-red-900";
    default:
      return "border-border bg-muted/30 text-foreground";
  }
}

function NarrativeCallout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-indigo-700 uppercase">
        <Sparkles size={13} /> {label}
      </p>
      <p className="text-base text-indigo-950">{children}</p>
    </div>
  );
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ uniqueKey: string }>;
}) {
  const { uniqueKey } = await params;

  const clientKey = await prisma.clientKey.findUnique({ where: { uniqueKey } });
  if (!clientKey) {
    notFound();
  }

  if (!clientKey.keyUsedAt) {
    return (
      <main className="flex min-h-screen flex-col bg-background">
        <header className="border-b border-border px-8 py-4">
          <h1 className="text-lg font-semibold text-foreground">
            AI-Native Software Development Maturity Assessment Guide
          </h1>
        </header>
        <div className="flex flex-col gap-4 px-8 py-6">
          <h2 className="text-lg font-semibold text-foreground">Report not available yet</h2>
          <p className="text-base text-foreground">
            This assessment hasn&apos;t been completed yet.
          </p>
          <div>
            <Link href={`/healthcheck/landing/${uniqueKey}`} className={buttonVariants()}>
              Go to assessment
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const [rawAnswers, narrative] = await prisma.$transaction([
    prisma.answer.findMany({
      where: { clientKeyId: clientKey.id, question: { isVisible: true } },
      include: {
        question: { select: { question: true, questionTypeId: true, stageId: true } },
        option: { select: { option: true, value: true } },
      },
    }),
    prisma.narrative.findUnique({ where: { clientKeyId: clientKey.id } }),
  ]);

  const answers: AnswerRecord[] = rawAnswers.map((a) => ({
    questionTypeId: a.question.questionTypeId as QuestionTypeId,
    stageId: a.question.stageId as StageId | null,
    questionText: a.question.question,
    optionText: a.option.option,
    value: a.option.value,
  }));

  const report = computeReport(answers);

  const stageInterpretations = (narrative?.stageInterpretations as Record<string, string>) ?? {};
  const roadmap =
    (narrative?.roadmap as { what: string; why: string; effort: string }[]) ?? [];
  const narrativePublished = !!narrative?.publishedAt;

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border px-8 py-4">
        <h1 className="text-lg font-semibold text-foreground">
          AI-Native Software Development Maturity Assessment Guide
        </h1>
      </header>

      <div className="flex max-w-4xl flex-col gap-10 px-8 py-6">
        {!narrativePublished && (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground">
            Your detailed recommendations and narrative analysis are still being prepared. This
            page will update automatically once they&apos;re ready — check back soon.
          </div>
        )}

        {/* Hero */}
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Overall Maturity Level</p>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold text-foreground">
              {formatLevel(report.overallLevel)}
            </span>
            <span className="text-xl font-medium text-foreground">
              {report.overallLevelLabel ?? "Not available"}
            </span>
          </div>
          {report.overallLevelDescription && (
            <p className="text-base text-muted-foreground">{report.overallLevelDescription}</p>
          )}
          {report.trafficLightSummary && (
            <p className="text-sm text-muted-foreground">
              Adoption stage:{" "}
              <span className="font-medium text-foreground">{report.trafficLightSummary.band}</span>{" "}
              ({report.trafficLightSummary.total}/12 traffic-light points)
            </p>
          )}
          {narrativePublished && narrative?.executiveSummary && (
            <div className="mt-2">
              <NarrativeCallout label="Executive Summary">
                {narrative.executiveSummary}
              </NarrativeCallout>
            </div>
          )}
        </div>

        {/* Top strengths / gaps */}
        {(report.topStrengths.length > 0 || report.topGaps.length > 0) && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h2 className="mb-2 text-base font-semibold text-foreground">Top Strengths</h2>
              <ul className="flex flex-col gap-1">
                {report.topStrengths.map((s) => (
                  <li key={s.stageLabel} className="text-sm text-foreground">
                    {s.stageLabel} — {s.level.toFixed(1)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-2 text-base font-semibold text-foreground">Top Gaps</h2>
              <ul className="flex flex-col gap-1">
                {report.topGaps.map((s) => (
                  <li key={s.stageLabel} className="text-sm text-foreground">
                    {s.stageLabel} — {s.level.toFixed(1)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Traffic Light Dashboard */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Traffic Light Dashboard</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {report.stages.map((stage) => (
              <div
                key={stage.stageId}
                className={`rounded-lg border p-4 ${trafficLightClasses(stage.trafficLight)}`}
              >
                <p className="text-sm font-medium">{stage.label}</p>
                <p className="text-2xl font-bold">{formatLevel(stage.level)}</p>
                <p className="text-xs">{stage.levelLabel ?? "No data"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Foundation & Governance status */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <h3 className="text-base font-semibold text-foreground">Foundation</h3>
            <p className="text-2xl font-bold text-foreground">
              {report.foundation.score}/{report.foundation.max || 9}
            </p>
            <p className="text-sm text-muted-foreground">
              {report.foundation.band ? `Foundation ${report.foundation.band}` : "No data"}
            </p>
            {report.foundation.interpretationText && (
              <p className="mt-1 text-sm text-muted-foreground">
                {report.foundation.interpretationText}
              </p>
            )}
            {report.foundation.flagText && (
              <p className="mt-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                ⚠️ {report.foundation.flagText}
              </p>
            )}
            {report.foundation.questions.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {report.foundation.questions.map((q, i) => (
                  <li key={i} className="text-sm">
                    <p className="text-foreground">{q.questionText}</p>
                    <p className="text-muted-foreground">→ {q.optionText}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-lg border border-border p-4">
            <h3 className="text-base font-semibold text-foreground">Governance</h3>
            <p className="text-2xl font-bold text-foreground">{formatLevel(report.governance.level)}</p>
            <p className="text-sm text-muted-foreground">
              {report.governance.levelLabel ?? "No data"}
            </p>
            {report.governance.questions.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {report.governance.questions.map((q, i) => (
                  <li key={i} className="text-sm">
                    <p className="text-foreground">{q.questionText}</p>
                    <p className="text-muted-foreground">→ {q.optionText}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Variance flags */}
        {report.varianceFlags.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-foreground">Flags</h2>
            {report.varianceFlags.map((flag, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground"
              >
                <span className="font-medium">⚠️ {flag.title}:</span> {flag.message}
              </div>
            ))}
          </div>
        )}

        {/* Stage detail */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Stage Detail</h2>
          <div className="flex flex-col gap-4">
            {report.stages.map((stage) => (
              <div key={stage.stageId} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">{stage.label}</h3>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${trafficLightClasses(stage.trafficLight)}`}
                  >
                    {formatLevel(stage.level)} · {stage.levelLabel ?? "No data"}
                  </span>
                </div>
                {stage.questions.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-2">
                    {stage.questions.map((q, i) => (
                      <li key={i} className="text-sm">
                        <p className="text-foreground">{q.questionText}</p>
                        <p className="text-muted-foreground">→ {q.optionText}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {narrativePublished && stageInterpretations[String(stage.stageId)] && (
                  <div className="mt-3">
                    <NarrativeCallout label="Assessment Notes">
                      {stageInterpretations[String(stage.stageId)]}
                    </NarrativeCallout>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Roadmap */}
        {narrativePublished && roadmap.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Map size={18} className="text-indigo-600" /> Recommended Roadmap
            </h2>
            <div className="flex flex-col gap-4">
              {roadmap.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-4"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-base font-semibold text-indigo-950">{item.what}</p>
                      <span
                        className={`rounded-md border px-2 py-1 text-xs font-medium ${effortClasses(item.effort)}`}
                      >
                        Effort: {item.effort}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-indigo-900">{item.why}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Benchmark Context */}
        {narrativePublished && narrative?.benchmarkContext && (
          <div>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Compass size={18} className="text-indigo-600" /> Benchmark Context
            </h2>
            <NarrativeCallout label="How you compare">
              {narrative.benchmarkContext}
            </NarrativeCallout>
          </div>
        )}
      </div>
    </main>
  );
}
