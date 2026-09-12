import * as cheerio from "cheerio";
import type { CrawledPage } from "./crawler";

const TOKENS = [
  "careers",
  "jobs",
  "hiring",
  "join",
  "join-us",
  "work-with-us",
  "handbook",
  "interview",
  "process",
  "life-at",
  "culture",
  "team",
  "about",
  "engineering",
  "blog",
];

const URL_TOKEN_WEIGHT = 1;
const ANCHOR_TOKEN_WEIGHT = 2;
const NAV_FOOTER_BONUS = 3;

export interface ScoredLink {
  url: string;
  anchorText: string;
  score: number;
}

function countTokenMatches(text: string): number {
  const lower = text.toLowerCase();
  return TOKENS.reduce((count, token) => (lower.includes(token) ? count + 1 : count), 0);
}

function urlDepth(url: string): number {
  try {
    const { pathname } = new URL(url);
    return pathname.split("/").filter(Boolean).length;
  } catch {
    return 0;
  }
}

export function rankLinksInPage(html: string, pageUrl: string): ScoredLink[] {
  const $ = cheerio.load(html);
  const scored: ScoredLink[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    let resolvedUrl: string;
    try {
      resolvedUrl = new URL(href, pageUrl).toString();
    } catch {
      return;
    }

    const anchorText = $(el).text().trim();
    const urlScore = countTokenMatches(resolvedUrl) * URL_TOKEN_WEIGHT;
    const anchorScore = countTokenMatches(anchorText) * ANCHOR_TOKEN_WEIGHT;
    const depthPenalty = urlDepth(resolvedUrl);
    const inNavOrFooter = $(el).parents("nav, footer").length > 0;
    const bonus = inNavOrFooter ? NAV_FOOTER_BONUS : 0;

    const score = urlScore + anchorScore + bonus - depthPenalty;

    scored.push({ url: resolvedUrl, anchorText, score });
  });

  return scored;
}

export function rankLinks(pages: CrawledPage[]): ScoredLink[] {
  const bestByUrl = new Map<string, ScoredLink>();

  for (const page of pages) {
    const links = rankLinksInPage(page.html, page.url);
    for (const link of links) {
      const existing = bestByUrl.get(link.url);
      if (!existing || link.score > existing.score) {
        bestByUrl.set(link.url, link);
      }
    }
  }

  return Array.from(bestByUrl.values()).sort((a, b) => b.score - a.score);
}
