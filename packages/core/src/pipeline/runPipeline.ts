import type { LLMClient } from "../llm/LLMClient";
import type { Kit } from "../validate/kitSchema";
import { extractRole } from "../extract/extractRequirements";
import { crawlCompany } from "../retrieval/crawler";
import { findHiringPage } from "../generate/findHiringPage";
import { searchPublicDiscussion } from "../search/publicDiscussion";
import { buildCompanyBrief } from "../generate/buildCompanyBrief";
import { generateQuestions } from "../generate/generateQuestions";
import { generateFlashcards } from "../generate/generateFlashcards";
import { runCoverageLoop } from "../coverage/coverageLoop";
import { buildSchedule } from "../schedule/buildSchedule";
import { validateKit } from "../validate/index";

export const PIPELINE_STEP_NAMES = [
  "extractRole",
  "crawlCompany",
  "findHiringPage",
  "searchPublicDiscussion",
  "buildCompanyBrief",
  "generateQuestions",
  "coverageLoop",
  "generateFlashcards",
  "buildSchedule",
  "validateKit",
] as const;

export type PipelineStepName = (typeof PIPELINE_STEP_NAMES)[number];

export type OnStepCallback = (
  step: PipelineStepName,
  status: "running" | "done" | "failed",
  note?: string
) => void | Promise<void>;

export interface RunPipelineInput {
  jd: string;
  companyUrl: string;
  companyName: string;
  days: number;
  llmClient: LLMClient;
  onStep?: OnStepCallback;
}

export interface RunPipelineOutput {
  kit: Kit;
  validationErrors: string[];
}

async function runStep<T>(
  onStep: OnStepCallback | undefined,
  step: PipelineStepName,
  fn: () => Promise<T>
): Promise<T> {
  await onStep?.(step, "running");
  try {
    const result = await fn();
    await onStep?.(step, "done");
    return result;
  } catch (error) {
    const note = error instanceof Error ? error.message : String(error);
    await onStep?.(step, "failed", note);
    throw error;
  }
}

export async function runPipeline(input: RunPipelineInput): Promise<RunPipelineOutput> {
  const { jd, companyUrl, companyName, days, llmClient, onStep } = input;

  const role = await runStep(onStep, "extractRole", () => extractRole(jd, llmClient));

  const crawlResult = await runStep(onStep, "crawlCompany", () => crawlCompany(companyUrl));

  const hiringPage = await runStep(onStep, "findHiringPage", () =>
    findHiringPage(crawlResult.pages, llmClient)
  );

  const discussionSnippets = await runStep(onStep, "searchPublicDiscussion", () =>
    searchPublicDiscussion(companyName)
  );

  const companyBrief = await runStep(onStep, "buildCompanyBrief", () =>
    buildCompanyBrief(crawlResult, hiringPage, discussionSnippets, llmClient)
  );

  const initialQuestions = await runStep(onStep, "generateQuestions", () =>
    generateQuestions(role.requirements, hiringPage?.html ?? null, llmClient)
  );

  const coverageResult = await runStep(onStep, "coverageLoop", () =>
    runCoverageLoop(role.requirements, initialQuestions, llmClient)
  );

  const flashcards = await runStep(onStep, "generateFlashcards", () =>
    generateFlashcards(role.requirements, coverageResult.questions, llmClient)
  );

  const schedule = await runStep(onStep, "buildSchedule", async () =>
    buildSchedule(role.requirements, coverageResult.questions, days)
  );

  const pagesUsed = crawlResult.pages.map((page) => page.url);

  const kit: Kit = {
    version: 1,
    source: {
      company: companyName,
      company_url: companyUrl,
      role: role.title,
      location: "",
      jd_chars: jd.length,
      researched_at: new Date().toISOString(),
      pages_used: pagesUsed,
    },
    company_brief: companyBrief,
    role,
    questions: coverageResult.questions,
    flashcards,
    schedule,
    coverage: {
      uncovered_requirement_ids: coverageResult.uncoveredRequirementIds,
      passes: coverageResult.passes,
    },
  };

  const validation = await runStep(onStep, "validateKit", async () => validateKit(kit));

  return { kit, validationErrors: validation.errors };
}
