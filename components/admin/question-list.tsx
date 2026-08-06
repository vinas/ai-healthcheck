"use client";

import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
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
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Question</TableHead>
            <TableHead>Options</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody className={loading ? "opacity-50" : ""}>
          {questions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="py-6 text-center text-muted-foreground">
                No questions found.
              </TableCell>
            </TableRow>
          ) : (
            questions.map((q) => (
              <Fragment key={q.id}>
                <TableRow className={q.isVisible ? "" : "opacity-50"}>
                  <TableCell>{q.id}</TableCell>
                  <TableCell>{q.questionType.label}</TableCell>
                  <TableCell>{q.stage?.label ?? "—"}</TableCell>
                  <TableCell title={q.question}>
                    {q.question}
                  </TableCell>
                  <TableCell>{q.options.length}</TableCell>
                  <TableCell>
                    {q.isVisible ? "Visible" : "Hidden"}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
                {editingId === q.id && (
                  <TableRow className="bg-muted/20">
                    <TableCell colSpan={COLUMN_COUNT} className="py-4">
                      <QuestionForm
                        mode="edit"
                        initialQuestion={q}
                        questionTypes={questionTypes}
                        stages={stages}
                        onSaved={onSaved}
                        onCancel={() => setEditingId(null)}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
