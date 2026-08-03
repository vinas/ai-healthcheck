"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AssessmentFooter from "@/components/healthcheck/assessment-footer";
import { getAnswer, setAnswer } from "@/lib/assessment-answers";

type QuestionStepProps = {
  uniqueKey: string;
  question: { id: number; question: string; options: { id: number; option: string }[] };
  position: number;
  total: number;
  backHref: string;
  nextHref: string;
  groupLabel?: string;
};

function noopSubscribe() {
  return () => {};
}

function getServerAnswerSnapshot() {
  return undefined;
}

export default function QuestionStep({
  uniqueKey,
  question,
  position,
  total,
  backHref,
  nextHref,
  groupLabel,
}: QuestionStepProps) {
  const router = useRouter();

  // sessionStorage only exists client-side, so the previously stored answer
  // can't be known during server rendering. useSyncExternalStore is React's
  // sanctioned way to read a value like this: it renders `undefined` on the
  // server (and on the client's first hydration pass, to match), then
  // immediately reflects the real client-only value right after — without
  // the hydration-mismatch warning a useState+useEffect version would cause.
  const storedAnswer = useSyncExternalStore(
    noopSubscribe,
    () => getAnswer(uniqueKey, question.id),
    getServerAnswerSnapshot
  );
  const [override, setOverride] = useState<number | undefined>(undefined);
  const selected = override ?? storedAnswer;

  function handleNext() {
    if (selected == null) return;
    setAnswer(uniqueKey, question.id, selected);
    router.push(nextHref);
  }

  return (
    <>
      <div className="flex flex-col gap-8 px-8 py-6">
        <div className="flex max-w-2xl flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {groupLabel ? `${groupLabel} — ` : ""}Question {position} of {total}
          </p>
          <h2 className="text-lg font-semibold text-foreground">{question.question}</h2>
          <div className="flex flex-col gap-2">
            {question.options.map((opt) => (
              <label
                key={opt.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                  selected === opt.id
                    ? "border-foreground bg-secondary text-secondary-foreground"
                    : "border-border text-foreground hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={opt.id}
                  checked={selected === opt.id}
                  onChange={() => setOverride(opt.id)}
                  className="sr-only"
                />
                {opt.option}
              </label>
            ))}
          </div>
        </div>
      </div>
      <AssessmentFooter backHref={backHref} onNextClick={handleNext} nextDisabled={selected == null} />
    </>
  );
}
