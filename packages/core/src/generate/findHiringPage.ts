import { z } from "zod";
import type { CrawledPage } from "../retrieval/crawler";
import { rankLinks } from "../retrieval/linkRanker";
import { fetchPage } from "../retrieval/fetcher";
import type { LLMClient } from "../llm/LLMClient";
import { parseJsonWithRepair } from "../llm/repairJson";

const TOP_CANDIDATES = 5;

const ClassificationSchema = z.object({
  category: z.enum(["hiring", "about", "neither"]),
});

export interface HiringPageResult {
  url: string;
  html: string;
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
    html.slice(0, 8000),
  ].join("\n\n");
}

async function classifyPage(html: string, llmClient: LLMClient): Promise<string> {
  const prompt = buildClassifyPrompt(html);
  const rawText = await llmClient.generateText(prompt);
  const result = await parseJsonWithRepair(rawText, ClassificationSchema, llmClient, prompt);
  return result?.category ?? "neither";
}

export async function findHiringPage(
  pages: CrawledPage[],
  llmClient: LLMClient
): Promise<HiringPageResult | null> {
  const ranked = rankLinks(pages);
  const pagesByUrl = new Map(pages.map((page) => [page.url, page]));

  const seen = new Set<string>();
  const candidates = [];
  for (const link of ranked) {
    if (seen.has(link.url)) continue;
    seen.add(link.url);
    candidates.push(link.url);
    if (candidates.length >= TOP_CANDIDATES) break;
  }

  for (const url of candidates) {
    const alreadyCrawled = pagesByUrl.get(url);
    const html = alreadyCrawled ? alreadyCrawled.html : (await fetchPage(url))?.html;
    if (!html) continue;

    const category = await classifyPage(html, llmClient);
    if (category === "hiring") {
      return { url, html };
    }
  }

  return null;
}
