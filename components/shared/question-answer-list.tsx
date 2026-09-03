type QuestionAnswerListProps = {
  questions: { questionText: string; optionText: string }[];
  className?: string;
};

export function QuestionAnswerList({ questions, className }: QuestionAnswerListProps) {
  if (questions.length === 0) return null;

  return (
    <ul className={className ?? "mt-3 flex flex-col gap-2"}>
      {questions.map((q, i) => (
        <li key={i} className="text-sm">
          <p className="text-foreground">{q.questionText}</p>
          <p className="text-muted-foreground">→ {q.optionText}</p>
        </li>
      ))}
    </ul>
  );
}
