import { describe, it, expect, vi } from "vitest";
import { OpenAICompatibleClient } from "../src/llm/OpenAICompatibleClient";
import { FallbackLLMClient } from "../src/llm/FallbackLLMClient";
import { createLlmClient } from "../src/llm/createLlmClient";
import type { LLMClient } from "../src/llm/LLMClient";

function okResponse(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
}

function makeClient(fetchImpl: typeof fetch): OpenAICompatibleClient {
  return new OpenAICompatibleClient("test-key", {
    name: "nvidia",
    baseUrl: "https://example.test/v1",
    model: "some/model",
    requestsPerMinute: 600,
    tokensPerMinute: 1_000_000,
    fetchImpl,
  });
}

describe("OpenAICompatibleClient", () => {
  it("sends model, prompt and bearer key, and returns the message content", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse("hello"));
    const client = makeClient(fetchImpl as unknown as typeof fetch);

    await expect(client.generateText("hi")).resolves.toBe("hello");

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://example.test/v1/chat/completions");
    expect(init.headers.authorization).toBe("Bearer test-key");
    expect(JSON.parse(init.body)).toEqual({
      model: "some/model",
      messages: [{ role: "user", content: "hi" }],
    });
  });

  it("does not retry a 401", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("nope", { status: 401 }));
    const client = makeClient(fetchImpl as unknown as typeof fetch);

    await expect(client.generateText("hi")).rejects.toThrow("HTTP 401");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries once on a 500 and then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("boom", { status: 500 }))
      .mockResolvedValueOnce(okResponse("recovered"));
    const client = makeClient(fetchImpl as unknown as typeof fetch);

    await expect(client.generateText("hi")).resolves.toBe("recovered");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("treats an empty completion as a failure", async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => okResponse("   "));
    const client = makeClient(fetchImpl as unknown as typeof fetch);

    await expect(client.generateText("hi")).rejects.toThrow("empty response");
  });
});

describe("FallbackLLMClient", () => {
  const failing = (message: string): LLMClient => ({
    generateText: vi.fn().mockRejectedValue(new Error(message)),
  });
  const working = (text: string): LLMClient => ({
    generateText: vi.fn().mockResolvedValue(text),
  });

  it("uses the first provider when it works and never calls the others", async () => {
    const first = working("from nvidia");
    const second = working("from groq");
    const client = new FallbackLLMClient([
      { name: "nvidia", client: first },
      { name: "groq", client: second },
    ]);

    await expect(client.generateText("p")).resolves.toBe("from nvidia");
    expect(second.generateText).not.toHaveBeenCalled();
  });

  it("falls through nvidia and groq to gemini in order", async () => {
    const gemini = working("from gemini");
    const client = new FallbackLLMClient([
      { name: "nvidia", client: failing("nvidia down") },
      { name: "groq", client: failing("groq down") },
      { name: "gemini", client: gemini },
    ]);

    await expect(client.generateText("p")).resolves.toBe("from gemini");
  });

  it("reports every provider's failure when all fail", async () => {
    const client = new FallbackLLMClient([
      { name: "nvidia", client: failing("a") },
      { name: "groq", client: failing("b") },
    ]);

    await expect(client.generateText("p")).rejects.toThrow(
      "All LLM providers failed (nvidia: a | groq: b)"
    );
  });
});

describe("FallbackLLMClient cooldown", () => {
  it("skips a provider that just failed and retries it after the cooldown", async () => {
    let clock = 0;
    const flaky = { generateText: vi.fn().mockRejectedValue(new Error("down")) };
    const backup = { generateText: vi.fn().mockResolvedValue("backup") };
    const client = new FallbackLLMClient(
      [
        { name: "nvidia", client: flaky },
        { name: "groq", client: backup },
      ],
      () => clock
    );

    await client.generateText("p");
    await client.generateText("p");
    expect(flaky.generateText).toHaveBeenCalledTimes(1);

    clock = 61_000;
    await client.generateText("p");
    expect(flaky.generateText).toHaveBeenCalledTimes(2);
  });
});

describe("createLlmClient", () => {
  it("throws when no key is configured", () => {
    expect(() => createLlmClient({})).toThrow("No LLM provider configured");
  });

  it("builds a client when at least one key is present", () => {
    expect(() => createLlmClient({ geminiApiKey: "k" })).not.toThrow();
  });
});
