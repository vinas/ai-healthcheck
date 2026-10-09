"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { QuestionTypeId } from "@/lib/question-taxonomy";

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

  const isStagesType = questionTypeId === QuestionTypeId.Stages;

  function handleQuestionTypeChange(nextId: number | "") {
    setQuestionTypeId(nextId);
    setQuestionTypeError("");
    if (nextId !== QuestionTypeId.Stages) {
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
      <FormField
        label={<>Question <span className="text-destructive">*</span></>}
        htmlFor={`question-${mode}`}
        error={questionError}
      >
        <Textarea
          id={`question-${mode}`}
          placeholder="How is AI currently used when..."
          value={questionText}
          onChange={(e) => {
            setQuestionText(e.target.value);
            setQuestionError("");
          }}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={<>Question type <span className="text-destructive">*</span></>}
          error={questionTypeError}
        >
          <Select
            value={questionTypeId === "" ? null : questionTypeId}
            onValueChange={(v: number | null) => handleQuestionTypeChange(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a type…">
                {(v: number | null) => questionTypes.find((t) => t.id === v)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {questionTypes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {isStagesType && (
          <FormField
            label={<>Stage <span className="text-destructive">*</span></>}
            error={stageError}
          >
            <Select
              value={stageId === "" ? null : stageId}
              onValueChange={(v: number | null) => {
                setStageId(v ?? "");
                setStageError("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a stage…">
                  {(v: number | null) => stages.find((s) => s.id === v)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      </div>

      <FormField
        label={<>Options <span className="text-destructive">*</span></>}
        as="span"
        gap="gap-2"
        error={optionsError}
      >
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <div key={opt.id ?? `new-${i}`} className="flex items-center gap-2">
              <Input
                type="text"
                placeholder={`Option ${i + 1}`}
                value={opt.option}
                onChange={(e) => updateOption(i, { option: e.target.value })}
              />
              <Input
                type="number"
                value={opt.value}
                onChange={(e) => updateOption(i, { value: Number(e.target.value) })}
                className="w-20 px-2"
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
      </FormField>

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
