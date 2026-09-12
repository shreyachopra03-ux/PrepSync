import * as cheerio from "cheerio";
import { fetchPage } from "../retrieval/fetcher";

const MAX_RESULTS = 5;

export interface DiscussionSnippet {
  title: string;
  url: string;
  snippet: string;
}

function buildQuery(companyName: string): string {
  return `${companyName} interview experience glassdoor reddit blind`;
}

async function searchWithTavily(
  query: string,
  apiKey: string
): Promise<DiscussionSnippet[] | null> {
  const page = await fetchPage("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, query, max_results: MAX_RESULTS }),
    allowedContentTypes: ["application/json"],
  });

  if (!page) return null;

  let data: { results?: { title: string; url: string; content: string }[] };
  try {
    data = JSON.parse(page.html);
  } catch {
    return null;
  }

  if (!data.results || data.results.length === 0) return null;

  return data.results.slice(0, MAX_RESULTS).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
  }));
}

async function searchWithDuckDuckGo(query: string): Promise<DiscussionSnippet[] | null> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const page = await fetchPage(url);
  if (!page) return null;

  const $ = cheerio.load(page.html);
  const snippets: DiscussionSnippet[] = [];

  $(".result").each((_, el) => {
    if (snippets.length >= MAX_RESULTS) return;
    const titleEl = $(el).find(".result__a");
    const title = titleEl.text().trim();
    const href = titleEl.attr("href");
    const snippet = $(el).find(".result__snippet").text().trim();
    if (title && href) {
      snippets.push({ title, url: href, snippet });
    }
  });

  return snippets.length > 0 ? snippets : null;
}

export async function searchPublicDiscussion(
  companyName: string
): Promise<DiscussionSnippet[] | null> {
  const query = buildQuery(companyName);
  const apiKey = process.env.TAVILY_API_KEY;

  if (apiKey) {
    const tavilyResults = await searchWithTavily(query, apiKey);
    if (tavilyResults) return tavilyResults;
  }

  return searchWithDuckDuckGo(query);
}
