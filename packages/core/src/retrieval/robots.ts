import robotsParser from "robots-parser";
import { fetchPage } from "./fetcher";

const MIN_CRAWL_DELAY_MS = 500;
const MAX_ROBOTS_CHARS = 32_000;
const USER_AGENT = "*";

export interface RobotsRules {
  isAllowed(url: string): boolean;
  crawlDelayMs: number;
}

const ALLOW_ALL_RULES: RobotsRules = {
  isAllowed: () => true,
  crawlDelayMs: MIN_CRAWL_DELAY_MS,
};

function robotsUrlFor(siteUrl: string): string | null {
  try {
    return new URL("/robots.txt", siteUrl).toString();
  } catch {
    return null;
  }
}

export async function fetchRobotsText(siteUrl: string): Promise<string | null> {
  const robotsUrl = robotsUrlFor(siteUrl);
  if (!robotsUrl) return null;

  const page = await fetchPage(robotsUrl, { allowedContentTypes: ["text/plain"] });
  return page ? page.html.slice(0, MAX_ROBOTS_CHARS) : null;
}

export function parseRobots(siteUrl: string, robotsTxt: string | null): RobotsRules {
  const robotsUrl = robotsUrlFor(siteUrl);
  if (!robotsUrl || robotsTxt === null) return ALLOW_ALL_RULES;

  const parsed = robotsParser(robotsUrl, robotsTxt);

  return {
    isAllowed: (url: string) => parsed.isAllowed(url, USER_AGENT) ?? true,
    crawlDelayMs: Math.max(MIN_CRAWL_DELAY_MS, (parsed.getCrawlDelay(USER_AGENT) ?? 0) * 1000),
  };
}

export async function fetchRobotsRules(siteUrl: string): Promise<RobotsRules> {
  return parseRobots(siteUrl, await fetchRobotsText(siteUrl));
}
