import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { crawlCompany, crawlFinished, crawlStep, initCrawl } from "../src/retrieval/crawler";

const SITE: Record<string, { type: string; body: string }> = {
  "https://acme.test/robots.txt": {
    type: "text/plain",
    body: "User-agent: *\nDisallow: /private\n",
  },
  "https://acme.test/": {
    type: "text/html",
    body: `<nav><a href="/careers">Careers</a></nav>
           <a href="/about">About us</a>
           <a href="/private/secret">Secret</a>
           <a href="https://other.test/x">Elsewhere</a>
           <a href="mailto:hi@acme.test">Mail</a>`,
  },
  "https://acme.test/careers": {
    type: "text/html",
    body: `<a href="/careers/engineering">Engineering roles</a><a href="/">Home</a>`,
  },
  "https://acme.test/about": { type: "text/html", body: `<a href="/careers">Jobs</a>` },
  "https://acme.test/careers/engineering": {
    type: "text/html",
    body: `<a href="/careers/engineering/backend">Backend</a>`,
  },
  "https://acme.test/careers/engineering/backend": { type: "text/html", body: "<p>deep</p>" },
};

let requested: string[] = [];

beforeEach(() => {
  requested = [];
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: URL | string) => {
      const url = input.toString();
      requested.push(url);
      const entry = SITE[url];
      if (!entry) return new Response("not found", { status: 404 });
      return new Response(entry.body, { headers: { "content-type": entry.type } });
    })
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function settle<T>(promise: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return promise;
}

describe("crawlCompany", () => {
  it("crawls same-origin pages breadth-first, honours robots.txt, and ranks hiring links first", async () => {
    const result = await settle(crawlCompany("https://acme.test/", { maxDepth: 2 }));

    const urls = result.pages.map((p) => p.url);
    expect(urls).toContain("https://acme.test/careers");
    expect(urls).toContain("https://acme.test/careers/engineering");
    expect(urls).not.toContain("https://acme.test/private/secret");
    expect(requested).not.toContain("https://other.test/x");
    expect(requested).not.toContain("https://acme.test/private/secret");
    expect(result.ranked[0].url.startsWith("https://acme.test/careers")).toBe(true);
  });

  it("does not go deeper than maxDepth", async () => {
    const result = await settle(crawlCompany("https://acme.test/", { maxDepth: 1 }));
    const urls = result.pages.map((p) => p.url);
    expect(urls).toContain("https://acme.test/careers");
    expect(urls).not.toContain("https://acme.test/careers/engineering");
  });

  it("never fetches more pages than maxPages", async () => {
    const result = await settle(crawlCompany("https://acme.test/", { maxPages: 2 }));
    const pageFetches = requested.filter((u) => !u.endsWith("robots.txt"));
    expect(pageFetches.length).toBeLessThanOrEqual(2);
    expect(result.pages.length).toBeLessThanOrEqual(2);
  });

  it("returns an honest empty result for an invalid start url", async () => {
    const result = await settle(crawlCompany("not a url"));
    expect(result.pages).toEqual([]);
    expect(result.skipped[0].reason).toBe("invalid url");
  });

  it("records failed fetches as skipped instead of throwing", async () => {
    const result = await settle(crawlCompany("https://acme.test/missing"));
    expect(result.pages).toEqual([]);
    expect(result.skipped.some((s) => s.reason === "fetch failed")).toBe(true);
  });
});

describe("crawl state machine", () => {
  it("survives a JSON round-trip between every step and gives the same result", async () => {
    const direct = await settle(crawlCompany("https://acme.test/", { concurrency: 1 }));

    requested = [];
    const drive = async () => {
      let state = await initCrawl("https://acme.test/", { concurrency: 1 });
      while (!crawlFinished(state)) {
        state = JSON.parse(JSON.stringify(await crawlStep(state, { concurrency: 1 })));
      }
      return state;
    };
    const state = await settle(drive());

    expect(state.pages.map((p) => p.url)).toEqual(direct.pages.map((p) => p.url));
    expect(JSON.stringify(state).length).toBeLessThan(200_000);
  });

  it("processes at most `concurrency` pages per step", async () => {
    const start = await settle(initCrawl("https://acme.test/"));
    const after = await settle(crawlStep(start, { concurrency: 1 }));
    expect(after.attempts).toBe(1);
    expect(after.pages).toHaveLength(1);
  });
});
