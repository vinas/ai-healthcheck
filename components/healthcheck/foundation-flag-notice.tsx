"use client";

import { useSyncExternalStore } from "react";
import { getAnswers } from "@/lib/assessment-answers";

export type FoundationQuestion = { id: number; options: { id: number; value: number }[] };

type FoundationFlagNoticeProps = {
  uniqueKey: string;
  foundationQuestions: FoundationQuestion[];
};

function noopSubscribe() {
  return () => {};
}

function getServerSnapshot() {
  return false;
}

function computeIsCritical(uniqueKey: string, foundationQuestions: FoundationQuestion[]): boolean {
  const answers = getAnswers(uniqueKey);
  const score = foundationQuestions.reduce((sum, q) => {
    const optionId = answers[String(q.id)];
    const option = q.options.find((o) => o.id === optionId);
    return sum + (option?.value ?? 0);
  }, 0);
  return score < 3;
}

export default function FoundationFlagNotice({ uniqueKey, foundationQuestions }: FoundationFlagNoticeProps) {
  const isCritical = useSyncExternalStore(
    noopSubscribe,
    () => computeIsCritical(uniqueKey, foundationQuestions),
    getServerSnapshot
  );

  if (!isCritical) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground">
      ⚠️ AI adoption is constrained by missing infrastructure. Stage scores may significantly
      understate potential.
    </div>
  );
}
