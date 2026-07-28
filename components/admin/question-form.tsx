"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring";

const textareaClass =
  "min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring";

const numberInputClass =
  "h-9 w-20 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring";

export type Lookup = { id: number; label: string };
export type OptionDTO = { id: number; option: string; value: number };
export type QuestionDTO = {
  id: number;
  questionTypeId: number;
  stageId: number | null;
  question: string;
  isVisible: boolean;
  questionType: Lookup;
  stage: Lookup | null;
  options: OptionDTO[];
};

type OptionDraft = { id?: number; option: string; value: number };

const STAGES_TYPE_LABEL = "Stages";
const MIN_OPTIONS = 2;

function blankOptions(): OptionDraft[] {
  return [
    { option: "", value: 0 },
    { option: "", value: 0 },
  ];
}

type QuestionFormProps = {
  mode: "create" | "edit";
  questionTypes: Lookup[];
  stages: Lookup[];
  initialQuestion?: QuestionDTO;
  onSaved: (question: QuestionDTO) => void;
  onCancel?: () => void;
};

export default function QuestionForm({
  mode,
  questionTypes,
  stages,
  initialQuestion,
  onSaved,
  onCancel,
}: QuestionFormProps) {
  const [questionTypeId, setQuestionTypeId] = useState<number | "">(
    initialQuestion?.questionTypeId ?? ""
  );
  const [stageId, setStageId] = useState<number | "">(
    initialQuestion?.stageId ?? ""
  );
  const [questionText, setQuestionText] = useState(initialQuestion?.question ?? "");
  const [options, setOptions] = useState<OptionDraft[]>(
    initialQuestion?.options.map((o) => ({ id: o.id, option: o.option, value: o.value })) ??
      blankOptions()
  );
  const [loading, setLoading] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const [questionTypeError, setQuestionTypeError] = useState("");
  const [stageError, setStageError] = useState("");
  const [optionsError, setOptionsError] = useState("");

  const selectedType = questionTypes.find((t) => t.id === questionTypeId);
  const isStagesType = selectedType?.label === STAGES_TYPE_LABEL;

  function handleQuestionTypeChange(value: string) {
    const nextId = value === "" ? "" : Number(value);
    setQuestionTypeId(nextId);
    setQuestionTypeError("");
    const nextType = questionTypes.find((t) => t.id === nextId);
    if (nextType?.label !== STAGES_TYPE_LABEL) {
      setStageId("");
      setStageError("");
    }
  }

  function updateOption(index: number, patch: Partial<OptionDraft>) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)));
    setOptionsError("");
  }

  function addOption() {
    setOptions((prev) => [...prev, { option: "", value: 0 }]);
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function resetToBlank() {
    setQuestionTypeId("");
    setStageId("");
    setQuestionText("");
    setOptions(blankOptions());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let hasError = false;

    if (questionText.trim() === "") {
      setQuestionError("Question text is required.");
      hasError = true;
    } else if (questionText.trim().length > 255) {
      setQuestionError("Question text must be 255 characters or fewer.");
      hasError = true;
    }

    if (questionTypeId === "") {
      setQuestionTypeError("Question type is required.");
      hasError = true;
    }

    if (isStagesType && stageId === "") {
      setStageError("Stage is required for this question type.");
      hasError = true;
    }

    if (options.length < MIN_OPTIONS) {
      setOptionsError(`At least ${MIN_OPTIONS} options are required.`);
      hasError = true;
    } else if (options.some((o) => o.option.trim() === "")) {
      setOptionsError("Every option needs text.");
      hasError = true;
    } else if (options.some((o) => o.option.trim().length > 255)) {
      setOptionsError("Option text must be 255 characters or fewer.");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const body = {
        questionTypeId,
        stageId: isStagesType ? stageId : null,
        question: questionText.trim(),
        options: options.map((o) => ({
          ...(o.id != null ? { id: o.id } : {}),
          option: o.option.trim(),
          value: o.value,
        })),
      };

      const res = await fetch(
        mode === "create" ? "/api/questions" : `/api/questions/${initialQuestion!.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (res.ok) {
        onSaved(data as QuestionDTO);
        if (mode === "create") {
          resetToBlank();
          toast.success("Question created.");
        } else {
          toast.success("Question updated.");
          onCancel?.();
        }
      } else {
        toast.error(data.error ?? "Something went wrong.");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`question-${mode}`} className="text-sm font-medium text-foreground">
          Question <span className="text-destructive">*</span>
        </label>
        <textarea
          id={`question-${mode}`}
          placeholder="How is AI currently used when..."
          value={questionText}
          onChange={(e) => {
            setQuestionText(e.target.value);
            setQuestionError("");
          }}
          className={textareaClass}
        />
        {questionError && <p className="text-sm text-destructive">{questionError}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Question type <span className="text-destructive">*</span>
          </label>
          <select
            value={questionTypeId}
            onChange={(e) => handleQuestionTypeChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Select a type…</option>
            {questionTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          {questionTypeError && <p className="text-sm text-destructive">{questionTypeError}</p>}
        </div>

        {isStagesType && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Stage <span className="text-destructive">*</span>
            </label>
            <select
              value={stageId}
              onChange={(e) => {
                setStageId(e.target.value === "" ? "" : Number(e.target.value));
                setStageError("");
              }}
              className={selectClass}
            >
              <option value="">Select a stage…</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            {stageError && <p className="text-sm text-destructive">{stageError}</p>}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">
          Options <span className="text-destructive">*</span>
        </span>
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <div key={opt.id ?? `new-${i}`} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Option ${i + 1}`}
                value={opt.option}
                onChange={(e) => updateOption(i, { option: e.target.value })}
                className={inputClass}
              />
              <input
                type="number"
                value={opt.value}
                onChange={(e) => updateOption(i, { value: Number(e.target.value) })}
                className={numberInputClass}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeOption(i)}
                disabled={options.length <= MIN_OPTIONS}
                title="Remove option"
              >
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
        <div>
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus size={14} /> Add option
          </Button>
        </div>
        {optionsError && <p className="text-sm text-destructive">{optionsError}</p>}
      </div>

      <div className="flex justify-end gap-2">
        {mode === "edit" && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create"
              : "Save"}
        </Button>
      </div>
    </form>
  );
}
