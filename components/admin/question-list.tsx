"use client";

import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import QuestionForm, { type Lookup, type QuestionDTO } from "./question-form";

type QuestionListProps = {
  questions: QuestionDTO[];
  questionTypes: Lookup[];
  stages: Lookup[];
  loading: boolean;
  onSaved: (question: QuestionDTO) => void;
};

const COLUMN_COUNT = 7;

export default function QuestionList({
  questions,
  questionTypes,
  stages,
  loading,
  onSaved,
}: QuestionListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  async function toggleVisibility(question: QuestionDTO) {
    setTogglingId(question.id);
    try {
      const res = await fetch(`/api/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !question.isVisible }),
      });
      const data = await res.json();
      if (res.ok) {
        onSaved(data as QuestionDTO);
        toast.success(question.isVisible ? "Question hidden." : "Question restored.");
      } else {
        toast.error(data.error ?? "Something went wrong.");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-2 text-left font-medium text-foreground">ID</th>
            <th className="px-4 py-2 text-left font-medium text-foreground">Type</th>
            <th className="px-4 py-2 text-left font-medium text-foreground">Stage</th>
            <th className="px-4 py-2 text-left font-medium text-foreground">Question</th>
            <th className="px-4 py-2 text-left font-medium text-foreground">Options</th>
            <th className="px-4 py-2 text-left font-medium text-foreground">Visibility</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className={loading ? "opacity-50" : ""}>
          {questions.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT} className="px-4 py-6 text-center text-muted-foreground">
                No questions found.
              </td>
            </tr>
          ) : (
            questions.map((q) => (
              <Fragment key={q.id}>
                <tr
                  className={`border-b border-border last:border-0 hover:bg-muted/30 ${
                    q.isVisible ? "" : "opacity-50"
                  }`}
                >
                  <td className="px-4 py-2 text-foreground">{q.id}</td>
                  <td className="px-4 py-2 text-foreground">{q.questionType.label}</td>
                  <td className="px-4 py-2 text-foreground">{q.stage?.label ?? "—"}</td>
                  <td className="px-4 py-2 text-foreground" title={q.question}>
                    {q.question}
                  </td>
                  <td className="px-4 py-2 text-foreground">{q.options.length}</td>
                  <td className="px-4 py-2 text-foreground">
                    {q.isVisible ? "Visible" : "Hidden"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(editingId === q.id ? null : q.id)}
                      >
                        {editingId === q.id ? "Cancel" : "Edit"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={togglingId === q.id}
                        onClick={() => toggleVisibility(q)}
                      >
                        {q.isVisible ? "Delete" : "Restore"}
                      </Button>
                    </div>
                  </td>
                </tr>
                {editingId === q.id && (
                  <tr className="border-b border-border last:border-0 bg-muted/20">
                    <td colSpan={COLUMN_COUNT} className="px-4 py-4">
                      <QuestionForm
                        mode="edit"
                        initialQuestion={q}
                        questionTypes={questionTypes}
                        stages={stages}
                        onSaved={onSaved}
                        onCancel={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
