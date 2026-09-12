import * as cheerio from "cheerio";
import pLimit from "p-limit";
import { fetchPage } from "./fetcher";
import { fetchRobotsRules } from "./robots";

const MAX_DEPTH = 2;
const MAX_PAGES = 20;
const CONCURRENCY = 2;

export interface CrawledPage {
  url: string;
  html: string;
  links: { url: string; anchorText: string }[];
}

export interface CrawlResult {
  pages: CrawledPage[];
  skipped: { url: string; reason: string }[];
}

function extractLinks(baseUrl: string, html: string): { url: string; anchorText: string }[] {
  const $ = cheerio.load(html);
  const links: { url: string; anchorText: string }[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const resolved = new URL(href, baseUrl).toString();
      links.push({ url: resolved, anchorText: $(el).text().trim() });
    } catch {
      return;
    }
  });

  return links;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function crawlCompany(startUrl: string): Promise<CrawlResult> {
  const pages: CrawledPage[] = [];
  const skipped: CrawlResult["skipped"] = [];
  const visited = new Set<string>();

  let origin: string;
  try {
    origin = new URL(startUrl).origin;
  } catch {
    return { pages, skipped: [{ url: startUrl, reason: "invalid url" }] };
  }

  const robotsRules = await fetchRobotsRules(startUrl);
  const limit = pLimit(CONCURRENCY);

  let queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];

  while (queue.length > 0 && pages.length < MAX_PAGES) {
    const batch = queue.slice(0, MAX_PAGES - pages.length);
    queue = queue.slice(batch.length);

    const results = await Promise.all(
      batch.map((item) =>
        limit(async () => {
          if (visited.has(item.url)) return null;
          visited.add(item.url);

          let itemOrigin: string;
          try {
            itemOrigin = new URL(item.url).origin;
          } catch {
            skipped.push({ url: item.url, reason: "invalid url" });
            return null;
          }

          if (itemOrigin !== origin) {
            skipped.push({ url: item.url, reason: "cross-origin" });
            return null;
          }

          if (!robotsRules.isAllowed(item.url)) {
            skipped.push({ url: item.url, reason: "disallowed by robots.txt" });
            return null;
          }

          await sleep(robotsRules.crawlDelayMs);

          const page = await fetchPage(item.url);
          if (!page) {
            skipped.push({ url: item.url, reason: "fetch failed" });
            return null;
          }

          const links = extractLinks(item.url, page.html);
          return { crawled: { url: item.url, html: page.html, links }, depth: item.depth };
        })
      )
    );

    for (const result of results) {
      if (!result) continue;
      pages.push(result.crawled);

      if (result.depth < MAX_DEPTH) {
        for (const link of result.crawled.links) {
          if (!visited.has(link.url)) {
            queue.push({ url: link.url, depth: result.depth + 1 });
          }
        }
      }
    }
  }

  return { pages, skipped };
}
