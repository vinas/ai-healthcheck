"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import StepIntroduction from "@/components/healthcheck/step-introduction";
import AssessmentFooter from "@/components/healthcheck/assessment-footer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAnswers, clearAnswers } from "@/lib/assessment-answers";

type CompletionStatusProps = {
  uniqueKey: string;
  backHref: string;
};

type Status = "submitting" | "success" | "alreadySubmitted" | "error";

const DEFAULT_ERROR_MESSAGE =
  "Something went wrong while submitting your answers. Please try again.";

export default function CompletionStatus({ uniqueKey, backHref }: CompletionStatusProps) {
  const [status, setStatus] = useState<Status>("submitting");
  const [errorMessage, setErrorMessage] = useState(DEFAULT_ERROR_MESSAGE);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;

    async function submit() {
      try {
        const res = await fetch(`/api/healthcheck/${uniqueKey}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(getAnswers(uniqueKey)),
        });

        if (res.ok) {
          clearAnswers(uniqueKey);
          setStatus("success");
          return;
        }

        if (res.status === 409) {
          clearAnswers(uniqueKey);
          setStatus("alreadySubmitted");
          return;
        }

        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error ?? DEFAULT_ERROR_MESSAGE);
        setStatus("error");
      } catch {
        setErrorMessage(DEFAULT_ERROR_MESSAGE);
        setStatus("error");
      }
    }

    submit();
  }, [uniqueKey]);

  if (status === "submitting") {
    return (
      <div className="flex flex-col gap-8 px-8 py-6">
        <StepIntroduction heading="Submitting…">
          <p className="text-base text-foreground">Submitting your answers…</p>
        </StepIntroduction>
      </div>
    );
  }

  if (status === "success" || status === "alreadySubmitted") {
    return (
      <>
        <div className="flex flex-col gap-8 px-8 py-6">
          <StepIntroduction heading="Assessment complete">
            <p className="text-base text-foreground">
              {status === "success"
                ? "Your answers have been submitted."
                : "This assessment has already been submitted."}{" "}
              Click the button below to see your report.
            </p>
          </StepIntroduction>
          <div className="flex max-w-2xl justify-center">
            <Link
              href={`/healthcheck/report/${uniqueKey}`}
              className={cn(buttonVariants({ size: "lg" }), "h-auto px-10 py-4 text-lg")}
            >
              Report
            </Link>
          </div>
        </div>
        <AssessmentFooter />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-8 px-8 py-6">
        <StepIntroduction heading="Something went wrong">
          <p className="text-base text-foreground">{errorMessage}</p>
        </StepIntroduction>
      </div>
      <AssessmentFooter backHref={backHref} />
    </>
  );
}
