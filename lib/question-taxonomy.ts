export enum QuestionTypeId {
  Context = 1,
  Foundation = 2,
  Stages = 3,
  Governance = 4,
}

export enum StageId {
  DemandDefinition = 1,
  ImplementationPlanning = 2,
  ImplementationCoding = 3,
  Testing = 4,
  PullRequestReview = 5,
  DeploymentDelivery = 6,
}

export const QUESTION_TYPE_LABELS: Record<QuestionTypeId, string> = {
  [QuestionTypeId.Context]: "Context",
  [QuestionTypeId.Foundation]: "Foundation",
  [QuestionTypeId.Stages]: "Stages",
  [QuestionTypeId.Governance]: "Governance",
};

export const STAGE_LABELS: Record<StageId, string> = {
  [StageId.DemandDefinition]: "Demand Definition",
  [StageId.ImplementationPlanning]: "Implementation Planning",
  [StageId.ImplementationCoding]: "Implementation (Coding)",
  [StageId.Testing]: "Testing",
  [StageId.PullRequestReview]: "Pull Request Review",
  [StageId.DeploymentDelivery]: "Deployment & Delivery",
};
