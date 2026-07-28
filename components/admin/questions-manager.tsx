"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import QuestionForm, { type Lookup, type QuestionDTO } from "./question-form";
import QuestionList from "./question-list";

export default function QuestionsManager() {
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [questionTypes, setQuestionTypes] = useState<Lookup[]>([]);
  const [stages, setStages] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      try {
        const res = await fetch("/api/questions");
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error ?? "Failed to load questions.");
          return;
        }
        const data = await res.json();
        setQuestions(data.questions);
        setQuestionTypes(data.questionTypes);
        setStages(data.stages);
      } catch {
        toast.error("An unexpected error occurred while loading questions.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  function handleSaved(question: QuestionDTO) {
    setQuestions((prev) => {
      const exists = prev.some((q) => q.id === question.id);
      return exists
        ? prev.map((q) => (q.id === question.id ? question : q))
        : [...prev, question];
    });
    setIsAddOpen(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="max-w-2xl rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setIsAddOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-base font-semibold text-foreground">New Question</span>
          <ChevronDown
            size={18}
            className={`text-muted-foreground transition-transform duration-200 ${isAddOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isAddOpen && (
          <div className="border-t border-border px-4 py-4">
            <QuestionForm
              mode="create"
              questionTypes={questionTypes}
              stages={stages}
              onSaved={handleSaved}
            />
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Questions</h2>
        <QuestionList
          questions={questions}
          questionTypes={questionTypes}
          stages={stages}
          loading={loading}
          onSaved={handleSaved}
        />
      </div>
    </div>
  );
}
