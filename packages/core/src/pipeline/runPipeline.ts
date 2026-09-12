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

export interface RunPipelineInput {
  jd: string;
  companyUrl: string;
  companyName: string;
  days: number;
  llmClient: LLMClient;
}

export interface RunPipelineOutput {
  kit: Kit;
  validationErrors: string[];
}

export async function runPipeline(input: RunPipelineInput): Promise<RunPipelineOutput> {
  const { jd, companyUrl, companyName, days, llmClient } = input;

  const role = await extractRole(jd, llmClient);

  const crawlResult = await crawlCompany(companyUrl);
  const hiringPage = await findHiringPage(crawlResult.pages, llmClient);
  const discussionSnippets = await searchPublicDiscussion(companyName);

  const companyBrief = await buildCompanyBrief(
    crawlResult,
    hiringPage,
    discussionSnippets,
    llmClient
  );

  const initialQuestions = await generateQuestions(
    role.requirements,
    hiringPage?.html ?? null,
    llmClient
  );

  const coverageResult = await runCoverageLoop(role.requirements, initialQuestions, llmClient);

  const flashcards = await generateFlashcards(
    role.requirements,
    coverageResult.questions,
    llmClient
  );

  const schedule = buildSchedule(role.requirements, coverageResult.questions, days);

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

  const validation = validateKit(kit);

  return { kit, validationErrors: validation.errors };
}
