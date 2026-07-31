import { prisma } from "@/lib/prisma";
import { QuestionTypeId } from "@/lib/question-taxonomy";

export type OptionPayload = { id?: number; option: unknown; value: unknown };

export type QuestionPayload = {
  questionTypeId: unknown;
  stageId: unknown;
  question: unknown;
  options: unknown;
};

export async function validateQuestionPayload(
  payload: QuestionPayload
): Promise<string | null> {
  const { questionTypeId, stageId, question, options } = payload;

  if (typeof question !== "string" || question.trim() === "") {
    return "question is required.";
  }
  if (question.trim().length > 255) {
    return "question must be 255 characters or fewer.";
  }

  if (typeof questionTypeId !== "number" || !Number.isInteger(questionTypeId)) {
    return "questionTypeId is required.";
  }

  const questionType = await prisma.questionType.findUnique({
    where: { id: questionTypeId },
  });
  if (!questionType) {
    return "questionTypeId does not reference an existing question type.";
  }

  const isStagesType = questionType.id === QuestionTypeId.Stages;
  if (isStagesType) {
    if (typeof stageId !== "number" || !Number.isInteger(stageId)) {
      return "stageId is required when question type is Stages.";
    }
    const stage = await prisma.stage.findUnique({ where: { id: stageId } });
    if (!stage) {
      return "stageId does not reference an existing stage.";
    }
  } else if (stageId !== null && stageId !== undefined) {
    return "stageId must not be set unless question type is Stages.";
  }

  if (!Array.isArray(options) || options.length < 2) {
    return "At least 2 options are required.";
  }
  for (const o of options as OptionPayload[]) {
    if (typeof o.option !== "string" || o.option.trim() === "") {
      return "Each option must have text.";
    }
    if (o.option.trim().length > 255) {
      return "Option text must be 255 characters or fewer.";
    }
    if (typeof o.value !== "number" || !Number.isInteger(o.value)) {
      return "Each option value must be an integer.";
    }
  }

  return null;
}
