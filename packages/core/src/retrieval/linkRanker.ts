import { extractLinks, type ExtractedLink } from "./htmlLinks";

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
const DEFAULT_RANKED_CAP = 60;

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

export function scoreLink(link: ExtractedLink): number {
  const urlScore = countTokenMatches(link.url) * URL_TOKEN_WEIGHT;
  const anchorScore = countTokenMatches(link.anchorText) * ANCHOR_TOKEN_WEIGHT;
  const bonus = link.inNavOrFooter ? NAV_FOOTER_BONUS : 0;
  return urlScore + anchorScore + bonus - urlDepth(link.url);
}

export function scoreLinks(links: ExtractedLink[]): ScoredLink[] {
  return links.map((link) => ({
    url: link.url,
    anchorText: link.anchorText,
    score: scoreLink(link),
  }));
}

export function rankLinksInPage(html: string, pageUrl: string): ScoredLink[] {
  return scoreLinks(extractLinks(html, pageUrl));
}

export function mergeScoredLinks(
  existing: Record<string, ScoredLink>,
  incoming: ScoredLink[],
  cap: number = DEFAULT_RANKED_CAP
): Record<string, ScoredLink> {
  const merged = { ...existing };

  for (const link of incoming) {
    const previous = merged[link.url];
    if (!previous || link.score > previous.score) {
      merged[link.url] = link;
    }
  }

  const entries = Object.values(merged);
  if (entries.length <= cap) return merged;

  const trimmed: Record<string, ScoredLink> = {};
  for (const entry of entries.sort((a, b) => b.score - a.score).slice(0, cap)) {
    trimmed[entry.url] = entry;
  }
  return trimmed;
}

export function sortScoredLinks(ranked: Record<string, ScoredLink>): ScoredLink[] {
  return Object.values(ranked).sort((a, b) => b.score - a.score);
}
