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
import { inlineRunStep, type RunStep } from "./runStep";

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

export interface PipelineLimits {
  maxPages?: number;
  maxDepth?: number;
  crawlConcurrency?: number;
  maxPageBytes?: number;
  hiringCandidates?: number;
  allowHiringRefetch?: boolean;
}

export interface RunPipelineInput {
  jd: string;
  companyUrl: string;
  companyName: string;
  days: number;
  llmClient: LLMClient;
  onStep?: OnStepCallback;
  runStep?: RunStep;
  limits?: PipelineLimits;
}

export interface RunPipelineOutput {
  kit: Kit;
  validationErrors: string[];
}

async function stage<T>(
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
  const { jd, companyUrl, companyName, days, llmClient, onStep, limits = {} } = input;
  const run = input.runStep ?? inlineRunStep;

  const role = await stage(onStep, "extractRole", () =>
    run("extract-role", () => extractRole(jd, llmClient))
  );

  const crawlResult = await stage(onStep, "crawlCompany", () =>
    crawlCompany(
      companyUrl,
      {
        maxPages: limits.maxPages,
        maxDepth: limits.maxDepth,
        concurrency: limits.crawlConcurrency,
        maxPageBytes: limits.maxPageBytes,
      },
      run
    )
  );

  const hiringPage = await stage(onStep, "findHiringPage", () =>
    findHiringPage(
      crawlResult.pages,
      crawlResult.ranked,
      llmClient,
      { candidates: limits.hiringCandidates, allowRefetch: limits.allowHiringRefetch },
      run
    )
  );

  const discussionSnippets = await stage(onStep, "searchPublicDiscussion", () =>
    run("search-discussion", () => searchPublicDiscussion(companyName))
  );

  const companyBrief = await stage(onStep, "buildCompanyBrief", () =>
    run("company-brief", () =>
      buildCompanyBrief(crawlResult, hiringPage, discussionSnippets, llmClient)
    )
  );

  const initialQuestions = await stage(onStep, "generateQuestions", () =>
    generateQuestions(role.requirements, hiringPage?.html ?? null, llmClient, run)
  );

  const coverageResult = await stage(onStep, "coverageLoop", () =>
    runCoverageLoop(role.requirements, initialQuestions, llmClient, run)
  );

  const flashcards = await stage(onStep, "generateFlashcards", () =>
    run("flashcards", () => generateFlashcards(role.requirements, coverageResult.questions, llmClient))
  );

  const schedule = await stage(onStep, "buildSchedule", () =>
    run("build-schedule", async () =>
      buildSchedule(role.requirements, coverageResult.questions, days)
    )
  );

  const kit: Kit = {
    version: 1,
    source: {
      company: companyName,
      company_url: companyUrl,
      role: role.title,
      location: "",
      jd_chars: jd.length,
      researched_at: new Date().toISOString(),
      pages_used: crawlResult.pages.map((page) => page.url),
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

  const validation = await stage(onStep, "validateKit", () =>
    run("validate-kit", async () => validateKit(kit))
  );

  return { kit, validationErrors: validation.errors };
}
