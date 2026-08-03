import { QuestionTypeId, QUESTION_TYPE_LABELS } from "@/lib/question-taxonomy";

export type AssessmentStepId = "introduction" | QuestionTypeId;

const STEPS: { id: AssessmentStepId; label: string }[] = [
  { id: "introduction", label: "Introduction" },
  { id: QuestionTypeId.Context, label: QUESTION_TYPE_LABELS[QuestionTypeId.Context] },
  { id: QuestionTypeId.Foundation, label: QUESTION_TYPE_LABELS[QuestionTypeId.Foundation] },
  { id: QuestionTypeId.Stages, label: QUESTION_TYPE_LABELS[QuestionTypeId.Stages] },
  { id: QuestionTypeId.Governance, label: QUESTION_TYPE_LABELS[QuestionTypeId.Governance] },
];

const activeStepClass =
  "rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground";
const inactiveStepClass =
  "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground";

type AssessmentHeaderProps = {
  activeStep: AssessmentStepId;
};

export default function AssessmentHeader({ activeStep }: AssessmentHeaderProps) {
  return (
    <header className="border-b border-border px-8 py-4">
      <div className="flex flex-col gap-3">
        <h1 className="text-lg font-semibold text-foreground">
          AI-Native Software Development Maturity Assessment Guide
        </h1>
        <nav className="flex flex-wrap items-center gap-2" aria-label="Assessment sections">
          {STEPS.map(({ id, label }) => (
            <span key={id} className={id === activeStep ? activeStepClass : inactiveStepClass}>
              {label}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
