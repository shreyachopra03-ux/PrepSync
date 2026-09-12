import robotsParser from "robots-parser";
import { fetchPage } from "./fetcher";

const MIN_CRAWL_DELAY_MS = 500;
const USER_AGENT = "*";

export interface RobotsRules {
  isAllowed(url: string): boolean;
  crawlDelayMs: number;
}

const ALLOW_ALL_RULES: RobotsRules = {
  isAllowed: () => true,
  crawlDelayMs: MIN_CRAWL_DELAY_MS,
};

export async function fetchRobotsRules(siteUrl: string): Promise<RobotsRules> {
  let robotsUrl: string;
  try {
    robotsUrl = new URL("/robots.txt", siteUrl).toString();
  } catch {
    return ALLOW_ALL_RULES;
  }

  const page = await fetchPage(robotsUrl, { allowedContentTypes: ["text/plain"] });
  if (!page) {
    return ALLOW_ALL_RULES;
  }

  const parsed = robotsParser(robotsUrl, page.html);

  return {
    isAllowed: (url: string) => parsed.isAllowed(url, USER_AGENT) ?? true,
    crawlDelayMs: Math.max(
      MIN_CRAWL_DELAY_MS,
      (parsed.getCrawlDelay(USER_AGENT) ?? 0) * 1000
    ),
  };
}
