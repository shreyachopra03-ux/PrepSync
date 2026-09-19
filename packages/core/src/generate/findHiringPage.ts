import { z } from "zod";
import type { LLMClient } from "../llm/LLMClient";
import { parseJsonWithRepair } from "../llm/repairJson";
import { inlineRunStep, type RunStep } from "../pipeline/runStep";
import { PAGE_HEAD_CHARS, type CrawledPage } from "../retrieval/crawler";
import { fetchPage } from "../retrieval/fetcher";
import type { ScoredLink } from "../retrieval/linkRanker";

const DEFAULT_CANDIDATES = 5;

const ClassificationSchema = z.object({
  category: z.enum(["hiring", "about", "neither"]),
});

export interface HiringPageResult {
  url: string;
  html: string;
}

export interface HiringLimits {
  candidates?: number;
  allowRefetch?: boolean;
}

interface ClassifiedCandidate extends HiringPageResult {
  category: string;
}

function buildClassifyPrompt(html: string): string {
  return [
    "Read the page content below and classify it into exactly one category:",
    '- "hiring": the page describes how this company hires, its interview process, or what it looks for in candidates',
    '- "about": the page describes what the company does, but not its hiring process',
    '- "neither": the page is unrelated to either',
    "Return JSON only, no prose, no code fences, matching this shape:",
    '{ "category": "hiring" | "about" | "neither" }',
    "Page content:",
    html.slice(0, PAGE_HEAD_CHARS),
  ].join("\n\n");
}

async function classifyPage(html: string, llmClient: LLMClient): Promise<string> {
  const prompt = buildClassifyPrompt(html);
  const rawText = await llmClient.generateText(prompt);
  const result = await parseJsonWithRepair(rawText, ClassificationSchema, llmClient, prompt);
  return result?.category ?? "neither";
}

export function pickHiringCandidates(
  ranked: ScoredLink[],
  pages: CrawledPage[],
  limits: HiringLimits = {}
): string[] {
  const limit = limits.candidates ?? DEFAULT_CANDIDATES;
  const crawled = new Set(pages.map((page) => page.url));
  const urls: string[] = [];

  for (const link of ranked) {
    if (limits.allowRefetch === false && !crawled.has(link.url)) continue;
    if (urls.includes(link.url)) continue;
    urls.push(link.url);
    if (urls.length >= limit) break;
  }

  return urls;
}

export async function findHiringPage(
  pages: CrawledPage[],
  ranked: ScoredLink[],
  llmClient: LLMClient,
  limits: HiringLimits = {},
  runStep: RunStep = inlineRunStep
): Promise<HiringPageResult | null> {
  const pagesByUrl = new Map(pages.map((page) => [page.url, page]));
  const candidates = pickHiringCandidates(ranked, pages, limits);

  for (let index = 0; index < candidates.length; index++) {
    const url = candidates[index];

    const result = await runStep(
      `hiring-classify-${index + 1}`,
      async (): Promise<ClassifiedCandidate | null> => {
        const crawled = pagesByUrl.get(url);
        const html = crawled ? crawled.html : (await fetchPage(url))?.html;
        if (!html) return null;

        const category = await classifyPage(html, llmClient);
        return { url, html: html.slice(0, PAGE_HEAD_CHARS), category };
      }
    );

    if (result && result.category === "hiring") {
      return { url: result.url, html: result.html };
    }
  }

  return null;
}
