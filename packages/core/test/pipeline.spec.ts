import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runPipeline, type PipelineStepName } from "../src/pipeline/runPipeline";
import type { RunStep } from "../src/pipeline/runStep";
import type { LLMClient } from "../src/llm/LLMClient";

const SITE: Record<string, string> = {
  "https://acme.test/": `<nav><a href="/careers">Careers</a></nav><a href="/about">About</a>`,
  "https://acme.test/careers": `<p>HIRING-PAGE-MARKER our interview process has 3 rounds</p><a href="/">Home</a>`,
  "https://acme.test/about": `<p>We build widgets.</p>`,
};

function idsIn(prompt: string): string[] {
  return Array.from(prompt.matchAll(/- id: (r\d+)/g)).map((m) => m[1]);
}

function makeFakeLlm(omitFromFirstPass: string) {
  const calls: string[] = [];

  const client: LLMClient = {
    async generateText(prompt: string): Promise<string> {
      if (prompt.includes("extracting structured hiring information")) {
        calls.push("extract");
        return JSON.stringify({
          title: "Backend Engineer",
          seniority: "Mid",
          responsibilities: ["Build APIs"],
          requirements: [
            { text: "Node.js", kind: "technical", priority: "must" },
            { text: "MongoDB", kind: "technical", priority: "must" },
            { text: "Mentoring juniors", kind: "behavioural", priority: "nice" },
          ],
        });
      }
      if (prompt.includes("classify it into exactly one category")) {
        calls.push("classify");
        return JSON.stringify({
          category: prompt.includes("HIRING-PAGE-MARKER") ? "hiring" : "neither",
        });
      }
      if (prompt.includes("Write a short, honest company brief")) {
        calls.push("brief");
        return JSON.stringify({ summary: "Acme builds widgets.", what_they_do: "Widgets." });
      }
      if (prompt.includes("TECHNICAL requirements") || prompt.includes("BEHAVIOURAL requirements")) {
        calls.push("questions");
        return JSON.stringify(
          idsIn(prompt)
            .filter((id) => id !== omitFromFirstPass)
            .map((id) => ({
              requirement_ids: [id],
              category: "technical",
              prompt: `Question about ${id}`,
              answer_outline: "outline",
              difficulty: 2,
            }))
        );
      }
      if (prompt.includes("not yet covered")) {
        calls.push("fill");
        return JSON.stringify(
          idsIn(prompt).map((id) => ({
            requirement_ids: [id],
            category: "technical",
            prompt: `Gap question about ${id}`,
            answer_outline: "outline",
            difficulty: 1,
          }))
        );
      }
      if (prompt.includes("quick-recall flashcards")) {
        calls.push("flashcards");
        return JSON.stringify(
          idsIn(prompt).map((id) => ({ requirement_ids: [id], front: `Front ${id}`, back: `Back ${id}` }))
        );
      }
      throw new Error(`Unexpected prompt: ${prompt.slice(0, 80)}`);
    },
  };

  return { client, calls };
}

let fetchedUrls: string[] = [];

beforeEach(() => {
  fetchedUrls = [];
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: URL | string) => {
      const url = input.toString();
      fetchedUrls.push(url);
      const body = SITE[url];
      if (body === undefined) return new Response("nope", { status: 404 });
      return new Response(body, { headers: { "content-type": "text/html" } });
    })
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("runPipeline (step-wise, as run inside a durable workflow)", () => {
  it("builds a valid kit, closes coverage gaps, and every durable step is small, JSON-safe and uniquely named", async () => {
    const { client, calls } = makeFakeLlm("r2");

    const stepNames: string[] = [];
    let largestStepBytes = 0;
    const runStep: RunStep = async (name, fn) => {
      stepNames.push(name);
      const result = await fn();
      const serialised = JSON.stringify(result === undefined ? null : result);
      largestStepBytes = Math.max(largestStepBytes, serialised.length);
      return JSON.parse(serialised);
    };

    const events: string[] = [];
    const promise = runPipeline({
      jd: "Backend Engineer. Node.js and MongoDB required. Mentoring juniors is a plus.",
      companyUrl: "https://acme.test/",
      companyName: "acme.test",
      days: 3,
      llmClient: client,
      runStep,
      onStep: (step: PipelineStepName, status) => {
        events.push(`${step}:${status}`);
      },
      limits: { maxPages: 6, crawlConcurrency: 1, hiringCandidates: 3, allowHiringRefetch: false },
    });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.validationErrors).toEqual([]);
    expect(result.kit.coverage.passes).toBe(2);
    expect(result.kit.coverage.uncovered_requirement_ids).toEqual([]);
    expect(result.kit.schedule.days).toHaveLength(3);
    expect(result.kit.source.pages_used).toContain("https://acme.test/careers");

    expect(new Set(stepNames).size).toBe(stepNames.length);
    expect(stepNames).toContain("coverage-fill-1");
    expect(stepNames.some((name) => name.startsWith("crawl-page-"))).toBe(true);
    expect(largestStepBytes).toBeLessThan(300_000);

    expect(events.filter((e) => e.endsWith(":running"))).toHaveLength(10);
    expect(events.filter((e) => e.endsWith(":done"))).toHaveLength(10);
    expect(events[0]).toBe("extractRole:running");
    expect(events[events.length - 1]).toBe("validateKit:done");

    expect(calls.filter((c) => c === "classify").length).toBeLessThanOrEqual(3);
    expect(fetchedUrls.some((u) => u.startsWith("https://acme.test/careers"))).toBe(true);
  });

  it("stays within a small external-request budget when limits are set for a constrained runtime", async () => {
    const { client } = makeFakeLlm("none");

    const promise = runPipeline({
      jd: "Backend Engineer. Node.js and MongoDB required.",
      companyUrl: "https://acme.test/",
      companyName: "acme.test",
      days: 2,
      llmClient: client,
      limits: { maxPages: 3, crawlConcurrency: 1, hiringCandidates: 2, allowHiringRefetch: false },
    });
    await vi.runAllTimersAsync();
    await promise;

    const nonSearchFetches = fetchedUrls.filter((u) => !u.includes("duckduckgo"));
    expect(nonSearchFetches.length).toBeLessThanOrEqual(1 + 3);
  });

  it("marks the failing stage and rethrows when a step throws", async () => {
    const failing: LLMClient = {
      generateText: async () => {
        throw new Error("model unavailable");
      },
    };
    const events: string[] = [];

    await expect(
      runPipeline({
        jd: "x",
        companyUrl: "https://acme.test/",
        companyName: "acme.test",
        days: 2,
        llmClient: failing,
        onStep: (step, status) => {
          events.push(`${step}:${status}`);
        },
      })
    ).rejects.toThrow();

    expect(events).toContain("extractRole:failed");
  });
});
