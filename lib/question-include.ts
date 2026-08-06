import type { Prisma } from "@prisma/client";
import { QuestionTypeId } from "@/lib/question-taxonomy";

export const QUESTION_INCLUDE = {
  questionType: true,
  stage: true,
  options: { orderBy: { id: "asc" as const } },
} satisfies Prisma.QuestionInclude;

export function resolveStageId(
  questionTypeId: number | undefined,
  stageId: number | null
): number | null {
  return questionTypeId === QuestionTypeId.Stages ? stageId : null;
}
