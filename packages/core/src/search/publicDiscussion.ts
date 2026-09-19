import { fetchPage } from "../retrieval/fetcher";
import { parseAnchors, readAttribute, textFromHtml } from "../retrieval/htmlLinks";

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

function normaliseDuckDuckGoUrl(href: string): string {
  const absolute = href.startsWith("//") ? `https:${href}` : href;
  try {
    const target = new URL(absolute).searchParams.get("uddg");
    return target ?? absolute;
  } catch {
    return absolute;
  }
}

async function searchWithDuckDuckGo(query: string): Promise<DiscussionSnippet[] | null> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const page = await fetchPage(url);
  if (!page) return null;

  const results: DiscussionSnippet[] = [];

  for (const anchor of parseAnchors(page.html)) {
    const className = readAttribute(anchor.attrs, "class") ?? "";

    if (className.includes("result__a")) {
      if (results.length >= MAX_RESULTS) break;
      const href = readAttribute(anchor.attrs, "href");
      const title = textFromHtml(anchor.inner);
      if (href && title) {
        results.push({ title, url: normaliseDuckDuckGoUrl(href), snippet: "" });
      }
    } else if (className.includes("result__snippet") && results.length > 0) {
      const last = results[results.length - 1];
      if (!last.snippet) last.snippet = textFromHtml(anchor.inner);
    }
  }

  return results.length > 0 ? results : null;
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
