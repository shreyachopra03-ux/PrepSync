import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LLMClient } from "./LLMClient";
import { TokenBucket } from "./tokenBucket";
import { withBackoff } from "./backoff";

const MODEL_NAME = "gemini-3.6-flash";
const CHARS_PER_TOKEN_ESTIMATE = 4;

export interface GeminiClientOptions {
  baseUrl?: string;
  requestsPerMinute: number;
  tokensPerMinute: number;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN_ESTIMATE);
}

function extractRetryAfterMs(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;

  const maybeStatus = (error as { status?: number }).status;
  if (maybeStatus !== 429) return null;

  const maybeMessage = (error as { message?: string }).message ?? "";
  const match = maybeMessage.match(/retry.*?(\d+(\.\d+)?)\s*s/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000);
  }

  return null;
}

export class GeminiClient implements LLMClient {
  private model;
  private tokenBucket: TokenBucket;

  constructor(apiKey: string, options: GeminiClientOptions) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel(
      { model: MODEL_NAME },
      options.baseUrl ? { baseUrl: options.baseUrl } : undefined
    );
    this.tokenBucket = new TokenBucket(options);
  }

  async generateText(prompt: string): Promise<string> {
    const estimatedTokens = estimateTokens(prompt);
    await this.tokenBucket.acquire(estimatedTokens);

    return withBackoff(
      async () => {
        const result = await this.model.generateContent(prompt);
        return result.response.text();
      },
      { getRetryAfterMs: extractRetryAfterMs }
    );
  }
}
