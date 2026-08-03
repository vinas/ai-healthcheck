export type AssessmentAnswers = Record<string, number>;

function storageKey(uniqueKey: string) {
  return `healthcheck-answers-${uniqueKey}`;
}

export function getAnswers(uniqueKey: string): AssessmentAnswers {
  try {
    const raw = window.sessionStorage.getItem(storageKey(uniqueKey));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getAnswer(uniqueKey: string, questionId: number): number | undefined {
  return getAnswers(uniqueKey)[String(questionId)];
}

export function setAnswer(uniqueKey: string, questionId: number, optionId: number): void {
  const answers = getAnswers(uniqueKey);
  answers[String(questionId)] = optionId;
  window.sessionStorage.setItem(storageKey(uniqueKey), JSON.stringify(answers));
}

export function clearAnswers(uniqueKey: string): void {
  window.sessionStorage.removeItem(storageKey(uniqueKey));
}
