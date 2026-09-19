import { inlineRunStep, type RunStep } from "../pipeline/runStep";
import { fetchPage } from "./fetcher";
import { extractLinks, type ExtractedLink } from "./htmlLinks";
import { mergeScoredLinks, scoreLinks, sortScoredLinks, type ScoredLink } from "./linkRanker";
import { fetchRobotsText, parseRobots } from "./robots";

export const PAGE_HEAD_CHARS = 8000;

const DEFAULT_MAX_DEPTH = 2;
const DEFAULT_MAX_PAGES = 20;
const DEFAULT_CONCURRENCY = 2;
const MAX_QUEUE = 150;
const MAX_SKIPPED = 50;

export interface CrawledPage {
  url: string;
  html: string;
}

export interface SkippedPage {
  url: string;
  reason: string;
}

export interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  concurrency?: number;
  maxPageBytes?: number;
}

export interface CrawlState {
  startUrl: string;
  origin: string;
  robotsTxt: string | null;
  crawlDelayMs: number;
  queue: { url: string; depth: number }[];
  seen: string[];
  pages: CrawledPage[];
  ranked: Record<string, ScoredLink>;
  skipped: SkippedPage[];
  attempts: number;
  maxPages: number;
  maxDepth: number;
}

export interface CrawlResult {
  pages: CrawledPage[];
  skipped: SkippedPage[];
  ranked: ScoredLink[];
}

interface ItemResult {
  attempted: boolean;
  skip?: SkippedPage;
  page?: CrawledPage;
  links?: ExtractedLink[];
  depth?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withoutHash(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  return parsed.toString();
}

export async function initCrawl(startUrl: string, options: CrawlOptions = {}): Promise<CrawlState> {
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;

  let origin: string;
  let first: string;
  try {
    origin = new URL(startUrl).origin;
    first = withoutHash(startUrl);
  } catch {
    return {
      startUrl,
      origin: "",
      robotsTxt: null,
      crawlDelayMs: 0,
      queue: [],
      seen: [],
      pages: [],
      ranked: {},
      skipped: [{ url: startUrl, reason: "invalid url" }],
      attempts: 0,
      maxPages,
      maxDepth,
    };
  }

  const robotsTxt = await fetchRobotsText(startUrl);
  const rules = parseRobots(startUrl, robotsTxt);

  return {
    startUrl,
    origin,
    robotsTxt,
    crawlDelayMs: rules.crawlDelayMs,
    queue: [{ url: first, depth: 0 }],
    seen: [first],
    pages: [],
    ranked: {},
    skipped: [],
    attempts: 0,
    maxPages,
    maxDepth,
  };
}

export function crawlFinished(state: CrawlState): boolean {
  return state.queue.length === 0 || state.attempts >= state.maxPages;
}

export async function crawlStep(state: CrawlState, options: CrawlOptions = {}): Promise<CrawlState> {
  if (crawlFinished(state)) return state;

  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const rules = parseRobots(state.startUrl, state.robotsTxt);

  const queue = [...state.queue];
  const batch = queue.splice(0, Math.min(concurrency, state.maxPages - state.attempts, queue.length));

  const results: ItemResult[] = await Promise.all(
    batch.map(async (item): Promise<ItemResult> => {
      if (!item.url.startsWith(`${state.origin}/`)) {
        return { attempted: false, skip: { url: item.url, reason: "cross-origin" } };
      }
      if (!rules.isAllowed(item.url)) {
        return { attempted: false, skip: { url: item.url, reason: "disallowed by robots.txt" } };
      }

      await sleep(state.crawlDelayMs);

      const page = await fetchPage(item.url, {
        maxBytes: options.maxPageBytes,
        truncate: options.maxPageBytes !== undefined,
      });
      if (!page) {
        return { attempted: true, skip: { url: item.url, reason: "fetch failed" } };
      }

      return {
        attempted: true,
        page: { url: item.url, html: page.html.slice(0, PAGE_HEAD_CHARS) },
        links: extractLinks(page.html, item.url),
        depth: item.depth,
      };
    })
  );

  const pages = [...state.pages];
  const skipped = [...state.skipped];
  const seen = new Set(state.seen);
  let ranked = state.ranked;
  let attempts = state.attempts;

  for (const result of results) {
    if (result.attempted) attempts++;
    if (result.skip && skipped.length < MAX_SKIPPED) skipped.push(result.skip);
    if (!result.page || !result.links) continue;

    pages.push(result.page);
    ranked = mergeScoredLinks(ranked, scoreLinks(result.links));

    if ((result.depth ?? 0) < state.maxDepth) {
      for (const link of result.links) {
        if (queue.length >= MAX_QUEUE) break;
        if (!link.url.startsWith(`${state.origin}/`) || seen.has(link.url)) continue;
        seen.add(link.url);
        queue.push({ url: link.url, depth: (result.depth ?? 0) + 1 });
      }
    }
  }

  return { ...state, queue, seen: Array.from(seen), pages, ranked, skipped, attempts };
}

export function toCrawlResult(state: CrawlState): CrawlResult {
  return {
    pages: state.pages,
    skipped: state.skipped,
    ranked: sortScoredLinks(state.ranked),
  };
}

export async function crawlCompany(
  startUrl: string,
  options: CrawlOptions = {},
  runStep: RunStep = inlineRunStep
): Promise<CrawlResult> {
  let state = await runStep("crawl-init", () => initCrawl(startUrl, options));

  let index = 0;
  while (!crawlFinished(state)) {
    const current = state;
    index += 1;
    state = await runStep(`crawl-page-${index}`, () => crawlStep(current, options));
  }

  return toCrawlResult(state);
}
