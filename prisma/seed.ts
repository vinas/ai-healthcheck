import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  QuestionTypeId,
  StageId,
  QUESTION_TYPE_LABELS,
  STAGE_LABELS,
} from "../lib/question-taxonomy";

const prisma = new PrismaClient();

type OptionSeed = { option: string; value: number };
type QuestionSeed = { question: string; options: OptionSeed[] };
type StageSeed = { id: StageId; questions: QuestionSeed[] };

function ctx(...options: string[]): OptionSeed[] {
  return options.map((option) => ({ option, value: 0 }));
}

function abcd(a: string, b: string, c: string, d: string): OptionSeed[] {
  return [
    { option: a, value: 0 },
    { option: b, value: 1 },
    { option: c, value: 2 },
    { option: d, value: 3 },
  ];
}

const CONTEXT_QUESTIONS: QuestionSeed[] = [
  {
    question:
      "How many software developers (including QA, DevOps, and related roles) does your organization employ?",
    options: ctx("Fewer than 10", "10–49", "50–199", "200–999", "1,000 or more"),
  },
  {
    question: "Which industry best describes your organization?",
    options: ctx(
      "Financial services",
      "Healthcare & life sciences",
      "Public sector",
      "Retail & e-commerce",
      "Manufacturing & logistics",
      "Technology",
      "Media & entertainment",
      "Other",
    ),
  },
  {
    question: "Which development methodology do your teams primarily follow?",
    options: ctx(
      "Agile",
      "Scrum",
      "SAFe or scaled agile",
      "Waterfall or milestone-based",
      "Kanban",
      "Mixed",
      "Other",
    ),
  },
  {
    question:
      "Has your organization conducted a formal AI maturity or readiness assessment before?",
    options: ctx(
      "No, this is the first",
      "Yes, within the last 12 months",
      "Yes, 1–3 years ago",
      "Yes, more than 3 years ago",
    ),
  },
  {
    question:
      "Do you currently collect baseline engineering metrics (e.g., deployment frequency, lead time, defect rates)?",
    options: ctx(
      "No metrics collected",
      "Some informal tracking",
      "Formal metrics for some teams",
      "Consistent org-wide metrics with historical baselines",
    ),
  },
  {
    question: "What is the primary driver for this AI assessment?",
    options: ctx(
      "Executive mandate",
      "Competitive pressure",
      "Developer productivity initiative",
      "Cost reduction",
      "Regulatory or compliance requirement",
      "Internal curiosity",
      "Other",
    ),
  },
];

const FOUNDATION_QUESTIONS: QuestionSeed[] = [
  {
    question:
      "Which AI tools are officially approved and available to your development team?",
    options: abcd(
      "No AI tools are formally approved — developers use personal tools at their own discretion",
      "1–2 tools informally recommended, with no organizational guidance or support",
      "Multiple tools officially approved, with documented guidance on appropriate use",
      "Comprehensive AI toolkit — approved tools, usage policies, onboarding resources, and technical support",
    ),
  },
  {
    question:
      "Are your AI tools integrated with internal systems (code repositories, documentation, knowledge bases, project management tools)?",
    options: abcd(
      "No integration — AI tools operate in isolation from internal systems",
      "Limited access — AI can read from public repositories or selected documents only",
      "Partial integration — AI connected to most major repositories and internal documentation",
      "Full integration — AI has real-time, contextual access to all relevant internal systems",
    ),
  },
  {
    question:
      "Is there a formal governance policy for AI tool usage in software development?",
    options: abcd(
      "No policy exists — AI usage is entirely ungoverned",
      "Informal guidelines shared by individuals or team leads, not officially documented",
      "Formal written policy exists but is not consistently enforced or kept up to date",
      "Formal, enforced policy — version-controlled, reviewed regularly, with clear ownership",
    ),
  },
];

const STAGE_QUESTIONS: StageSeed[] = [
  {
    id: StageId.DemandDefinition,
    questions: [
      {
        question: "How is AI currently used when defining or refining requirements?",
        options: abcd(
          "AI is not used in requirement definition",
          "A few individuals occasionally use AI tools (e.g., ChatGPT) informally for their own drafts",
          "AI tools are officially available and some teams regularly use them for requirement work",
          "AI is a standard, documented part of the requirement definition process for all teams",
        ),
      },
      {
        question: "Who participates in AI-assisted requirement activities?",
        options: abcd(
          "Nobody — AI is not used in this stage",
          "Individual developers experimenting on their own, without business stakeholder involvement",
          "Product managers and/or business analysts, on select projects",
          "All relevant stakeholders — business, product, and engineering — consistently across all projects",
        ),
      },
      {
        question:
          "Are there standardized prompts, templates, or workflows for AI-assisted requirement writing?",
        options: abcd(
          "No — individuals use whatever approach they prefer",
          "Individual contributors have personal templates they occasionally share informally",
          "Team-shared templates exist but adoption is optional and inconsistent across projects",
          "Standardized org-wide — documented, version-controlled, and actively maintained",
        ),
      },
      {
        question:
          "Are AI tools integrated with your requirement or project management platform (e.g., Jira, Azure DevOps, Confluence, Linear)?",
        options: abcd(
          "No integration — AI tools and the requirements platform are entirely separate",
          "Partial — AI outputs are manually copied into the platform by the author",
          "Light integration — AI can read from or write to the platform with some manual steps",
          "Full integration — AI reads context from and writes structured output directly into the platform",
        ),
      },
      {
        question:
          "Do you measure the quality impact of AI on requirements (e.g., rework rate, scope change frequency, requirement clarification requests)?",
        options: abcd(
          "No measurement exists for requirement quality",
          "Informal feedback only — stakeholders report whether requirements feel better",
          "Some metrics tracked occasionally (e.g., rework %) but without a consistent pre-AI baseline",
          "Consistent metrics tracked with pre-AI baselines, enabling quantified trend analysis",
        ),
      },
    ],
  },
  {
    id: StageId.ImplementationPlanning,
    questions: [
      {
        question:
          "How is AI used during implementation planning (technical design, task breakdown, estimation)?",
        options: abcd(
          "AI is not used in planning",
          "Some developers use AI individually to help plan their own tasks informally",
          "AI tools are available for planning and regularly used by most developers",
          "AI-assisted planning is standard — used consistently for all features, user stories, and epics",
        ),
      },
      {
        question:
          "How are AI-generated implementation plans validated before execution begins?",
        options: abcd(
          "Not applicable — AI does not generate plans",
          "No formal validation — the AI output is used as-is by the individual who generated it",
          "Senior developer or architect reviews AI-generated plans informally before work begins",
          "Structured review with defined criteria (architectural alignment, completeness, risk) before plans are approved",
        ),
      },
      {
        question:
          "Are there standardized prompts or templates for AI-assisted planning (architecture, estimation, task decomposition)?",
        options: abcd(
          "No — each developer prompts AI however they choose",
          "Some individuals have developed personal templates they use for their own work",
          "Team-level templates exist but adoption varies across teams and projects",
          "Org-wide standardized planning templates — documented, maintained, and used by all",
        ),
      },
      {
        question:
          "Can AI access your existing architecture documentation, system context, or codebase when generating plans?",
        options: abcd(
          "No — AI generates plans without access to any internal context",
          "AI has access to some documentation (e.g., wikis) but not the codebase or architecture diagrams",
          "AI has access to architecture documentation and selected repositories",
          "Full context available — AI accesses all relevant documentation, architecture, and live codebase",
        ),
      },
      {
        question:
          "Do you measure the accuracy or quality of AI-assisted plans (estimation variance, architecture review findings, plan acceptance rate)?",
        options: abcd(
          "No measurement",
          "Informal developer feedback only — no quantitative data",
          "Some metrics tracked (e.g., sprint velocity variance) without AI-specific attribution",
          "Consistent metrics with baselines — estimation accuracy, plan rework rate, and review findings tracked over time",
        ),
      },
    ],
  },
  {
    id: StageId.ImplementationCoding,
    questions: [
      {
        question:
          "What percentage of your development team regularly uses AI coding assistants (e.g., GitHub Copilot, Cursor, Claude Code, Codeium)?",
        options: abcd(
          "None — AI coding tools are not used",
          "A minority — fewer than 25% of developers",
          "A majority — 25–75% of developers",
          "Nearly all — more than 75% of developers use AI coding tools as part of their daily workflow",
        ),
      },
      {
        question:
          "What proportion of committed code is AI-assisted (written or substantially modified with AI help)?",
        options: abcd(
          "Negligible — less than 10% of committed code involves AI",
          "Minor — 10–30% of committed code is AI-assisted",
          "Significant — 30–60% of committed code is AI-assisted",
          "Dominant — more than 60% of committed code is AI-assisted",
        ),
      },
      {
        question:
          "Are there standardized workflows, coding conventions, or prompting patterns for AI-assisted implementation?",
        options: abcd(
          "No — AI use is entirely ad hoc",
          "Individual conventions only — no organizational guidance",
          "Team-level guidance exists (e.g., prompt libraries, conventions), but it is informal and not enforced",
          "Org-wide standards — documented coding conventions for AI-generated code, enforced through review",
        ),
      },
      {
        question: "Is AI-generated code always reviewed by a human developer before merging?",
        options: abcd(
          "No — there is no review process specific to AI-generated code",
          "Informal — the author reviews their own AI-generated code before committing",
          "Peer review is required, with some awareness that the code may be AI-generated",
          "Structured review with explicit criteria for AI-generated code quality, completeness, and security",
        ),
      },
      {
        question:
          "Do you systematically track the impact of AI on developer productivity (cycle time, throughput, feature velocity)?",
        options: abcd(
          "No measurement",
          "Anecdotal evidence only — developers report feeling more productive",
          "Productivity metrics collected (e.g., cycle time, throughput) but not attributed to AI specifically",
          "Systematic tracking — AI adoption rate correlated with productivity metrics, with pre-AI baseline comparison",
        ),
      },
    ],
  },
  {
    id: StageId.Testing,
    questions: [
      {
        question: "Is AI used to generate test cases (unit, integration, API, UI, or regression)?",
        options: abcd(
          "No — all test cases are written manually",
          "Individual developers occasionally use AI to generate test scaffolding or starting points",
          "AI test generation is officially available and used across most relevant test types",
          "AI test generation is a standard, documented part of the development workflow for all developers",
        ),
      },
      {
        question:
          "Which types of testing currently use AI assistance? (Select the highest level that applies)",
        options: abcd(
          "None — no AI-assisted testing",
          "Unit tests only, used by some developers on an ad hoc basis",
          "Unit and integration tests, used consistently by most developers",
          "Unit, integration, API, and/or regression tests — AI testing fully integrated into the delivery pipeline",
        ),
      },
      {
        question: "Are AI-generated tests reviewed and validated before being added to the test suite?",
        options: abcd(
          "No review — AI-generated tests are committed without review",
          "Author self-review only — no peer review of AI-generated tests",
          "AI-generated tests are reviewed during standard pull request review",
          "Structured review with coverage targets and quality criteria specifically for AI-generated tests",
        ),
      },
      {
        question:
          "Are tests automatically updated when related code changes (AI maintains tests alongside code)?",
        options: abcd(
          "No — test maintenance is entirely manual",
          "AI is occasionally used to update tests, but only when the developer remembers to ask",
          "AI test updates are part of the standard PR workflow for most code changes",
          "AI-driven test maintenance is automated — triggered by code changes in the CI/CD pipeline",
        ),
      },
      {
        question:
          "Do you measure test quality and the impact of AI on testing outcomes (coverage trends, defect escape rate, time-to-test)?",
        options: abcd(
          "No measurement",
          "Test coverage is tracked but not correlated with AI usage",
          "Coverage and defect metrics tracked; some baseline exists but not AI-specific",
          "Comprehensive measurement — AI impact on coverage, defect escape rate, and test authoring time tracked over time",
        ),
      },
    ],
  },
  {
    id: StageId.PullRequestReview,
    questions: [
      {
        question: "Is AI automatically triggered to review code when a pull request is opened?",
        options: abcd(
          "AI is not used in pull request reviews",
          "AI review is available and used occasionally by some developers, but not automatic",
          "AI review is automatically triggered on some repositories or for some teams",
          "AI review is automatically triggered on all pull requests, across all repositories",
        ),
      },
      {
        question: "What checks does AI perform during PR review? (Select the highest level that applies)",
        options: abcd(
          "No AI review",
          "Basic code quality or style checks only (linting-level)",
          "Code quality, security vulnerability detection, and best practice validation",
          "Comprehensive review — code quality, security, performance, documentation completeness, and architectural alignment",
        ),
      },
      {
        question: "Is AI review a required gate before a pull request can be merged?",
        options: abcd(
          "No — AI review has no formal status; merge decisions are human-only",
          "Recommended but optional — developers can merge without AI review",
          "Required for most repositories, with documented exceptions",
          "Mandatory for all repositories — PRs cannot progress without AI review completion",
        ),
      },
      {
        question: "Do developers actively address AI review comments before merging?",
        options: abcd(
          "Not tracked — unknown whether comments are addressed",
          "Informally — some developers address comments, others ignore them",
          "Most AI review comments are addressed before merging, though not consistently tracked",
          "Tracked — comment resolution rate is measured and used to evaluate AI review effectiveness and relevance",
        ),
      },
      {
        question:
          "Do you measure the impact of AI review on code quality outcomes (defects caught, PR cycle time, post-merge incidents)?",
        options: abcd(
          "No measurement",
          "Anecdotal — developers report that AI review catches issues, but no data exists",
          "Some metrics collected (e.g., review cycle time) without AI-specific attribution",
          "Systematic measurement — defects caught by AI vs human review, cycle time trends, and post-merge incident rates tracked",
        ),
      },
    ],
  },
  {
    id: StageId.DeploymentDelivery,
    questions: [
      {
        question: "Is AI used to assess deployment readiness or predict deployment risk before a release?",
        options: abcd(
          "AI is not involved in deployment decisions",
          "AI is occasionally consulted informally (e.g., a developer asks an AI chatbot about release risks)",
          "AI tools are available for deployment risk assessment and used as a regular step in the release process",
          "AI-assisted deployment readiness assessment is a standard, documented step for all releases",
        ),
      },
      {
        question:
          "Is AI integrated into your CI/CD pipeline (automated checks, quality gates, release decision support)?",
        options: abcd(
          "No AI integration in CI/CD pipelines",
          "AI tools are available but run separately from CI/CD, requiring manual invocation",
          "AI performs some automated checks as pipeline steps (e.g., security scan, deployment summary)",
          "AI is fully integrated — automated gates, risk scoring, environment promotion checks, and release recommendations",
        ),
      },
      {
        question: "Does AI assist with rollback decisions or incident response during deployment failures?",
        options: abcd(
          "No — incident response is entirely manual",
          "AI is occasionally consulted informally during incidents (e.g., asking an AI for diagnosis help)",
          "AI assists with incident diagnosis and suggests remediation options as part of a defined runbook",
          "AI-driven incident response is embedded in the pipeline — automated alerting, diagnosis, and rollback triggers with defined thresholds",
        ),
      },
      {
        question:
          "Do you track standard delivery metrics (deployment frequency, change failure rate, mean time to recovery, lead time for changes)?",
        options: abcd(
          "None of these metrics are currently tracked",
          "1–2 of these metrics tracked informally, without consistent historical data",
          "3–4 metrics tracked consistently, but not correlated with AI adoption",
          "All four metrics tracked with baselines before and after AI adoption, enabling direct impact measurement",
        ),
      },
      {
        question: "Do you specifically measure the impact of AI on deployment reliability or delivery speed?",
        options: abcd(
          "No measurement of AI impact on delivery",
          "Anecdotal improvement reported by engineers, but no supporting data",
          "Delivery metrics tracked but AI's contribution is not isolated from other improvements",
          "AI impact explicitly measured — deployment frequency and failure rate before/after AI adoption compared and reported",
        ),
      },
    ],
  },
];

const GOVERNANCE_QUESTIONS: QuestionSeed[] = [
  {
    question: "Who owns AI governance for software development in your organization?",
    options: abcd(
      "Nobody — there is no clear ownership of AI governance",
      "Informally managed by individual team leads or senior developers",
      "A designated role or team owns AI governance (e.g., CTO office, Platform Engineering Lead)",
      "A formal AI governance body with cross-functional representation (legal, security, engineering, product)",
    ),
  },
  {
    question: "How is sensitive or proprietary data protected when used with AI tools?",
    options: abcd(
      "No guidelines exist — developers decide independently",
      "Informal awareness — developers know they should be careful but have no formal guidance",
      "Written guidelines exist and are communicated, but enforcement is inconsistent",
      "Enforced policy with technical controls — enterprise AI tiers, data classification, and access restrictions",
    ),
  },
  {
    question:
      "Are AI-generated outputs (code, tests, plans, documentation) reviewed for quality, accuracy, and potential errors before use in production?",
    options: abcd(
      "No formal review process for AI-generated artifacts",
      "Authors informally review their own AI-generated work before using it",
      "Peer review is standard practice, with awareness that the artifact may be AI-generated",
      "Structured review with explicit criteria for AI-generated artifacts — hallucination checks, accuracy verification, and sign-off requirements",
    ),
  },
  {
    question: "Is AI tool selection and onboarding managed at the organizational level?",
    options: abcd(
      "Developers freely choose any AI tools without organizational involvement",
      "Some tool recommendations exist but adoption is entirely voluntary and ungoverned",
      "An approved tool list is maintained, with onboarding resources and basic guidance",
      "Formal evaluation, procurement, onboarding, and periodic review process for all AI tools",
    ),
  },
  {
    question: "Are AI tools assessed for security and compliance before organizational adoption?",
    options: abcd(
      "No security review process for AI tools",
      "Informal review by security-minded individuals, but not a formal requirement",
      "Security review is recommended and usually happens, but is not mandatory",
      "Mandatory formal security review with defined criteria before any AI tool is approved for organizational use",
    ),
  },
];

async function seedQuestionnaire() {
  const alreadySeeded = (await prisma.questionType.count()) > 0;
  if (alreadySeeded) {
    console.log("Questionnaire already seeded, skipping.");
    return;
  }

  await Promise.all(
    Object.values(QuestionTypeId)
      .filter((v): v is QuestionTypeId => typeof v === "number")
      .map((id) =>
        prisma.questionType.upsert({
          where: { id },
          update: { label: QUESTION_TYPE_LABELS[id] },
          create: { id, label: QUESTION_TYPE_LABELS[id] },
        })
      )
  );

  for (const q of CONTEXT_QUESTIONS) {
    await prisma.question.create({
      data: {
        questionTypeId: QuestionTypeId.Context,
        question: q.question,
        options: { create: q.options },
      },
    });
  }

  for (const q of FOUNDATION_QUESTIONS) {
    await prisma.question.create({
      data: {
        questionTypeId: QuestionTypeId.Foundation,
        question: q.question,
        options: { create: q.options },
      },
    });
  }

  for (const stageSeed of STAGE_QUESTIONS) {
    await prisma.stage.upsert({
      where: { id: stageSeed.id },
      update: { label: STAGE_LABELS[stageSeed.id] },
      create: { id: stageSeed.id, label: STAGE_LABELS[stageSeed.id] },
    });
    for (const q of stageSeed.questions) {
      await prisma.question.create({
        data: {
          questionTypeId: QuestionTypeId.Stages,
          stageId: stageSeed.id,
          question: q.question,
          options: { create: q.options },
        },
      });
    }
  }

  for (const q of GOVERNANCE_QUESTIONS) {
    await prisma.question.create({
      data: {
        questionTypeId: QuestionTypeId.Governance,
        question: q.question,
        options: { create: q.options },
      },
    });
  }

  console.log("Questionnaire seeded.");
}

async function main() {
  await prisma.user.upsert({
    where: { email: "vinas.deandrade@compile.fi" },
    update: {},
    create: {
      name: "Vinas",
      email: "vinas.deandrade@compile.fi",
      password: await bcrypt.hash("password", 10),
    },
  });

  await seedQuestionnaire();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
