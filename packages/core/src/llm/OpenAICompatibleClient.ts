import type { LLMClient } from "./LLMClient";
import { TokenBucket } from "./tokenBucket";
import { withBackoff } from "./backoff";

const CHARS_PER_TOKEN_ESTIMATE = 4;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 2;

export interface OpenAICompatibleOptions {
  name: string;
  baseUrl: string;
  model: string;
  requestsPerMinute: number;
  tokensPerMinute: number;
  fetchImpl?: typeof fetch;
}

class ProviderHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterMs: number | null
  ) {
    super(message);
  }
}

function isRetryable(error: unknown): boolean {
  if (error instanceof ProviderHttpError) {
    return error.status === 429 || error.status >= 500;
  }
  return true;
}

function retryAfterOf(error: unknown): number | null {
  return error instanceof ProviderHttpError ? error.retryAfterMs : null;
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) : null;
}

export class OpenAICompatibleClient implements LLMClient {
  private tokenBucket: TokenBucket;
  private fetchImpl: typeof fetch;

  constructor(
    private apiKey: string,
    private options: OpenAICompatibleOptions
  ) {
    this.tokenBucket = new TokenBucket(options);
    this.fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
  }

  async generateText(prompt: string): Promise<string> {
    const estimatedTokens = Math.min(
      Math.ceil(prompt.length / CHARS_PER_TOKEN_ESTIMATE),
      this.options.tokensPerMinute
    );
    await this.tokenBucket.acquire(estimatedTokens);

    return withBackoff(() => this.request(prompt), {
      maxAttempts: MAX_ATTEMPTS,
      shouldRetry: isRetryable,
      getRetryAfterMs: retryAfterOf,
    });
  }

  private async request(prompt: string): Promise<string> {
    const response = await this.fetchImpl(`${this.options.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: [{ role: "user", content: prompt }],
        ...(this.options.model.includes("gpt-oss") ? { reasoning_effort: "low" } : {}),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new ProviderHttpError(
        `${this.options.name} responded with HTTP ${response.status}`,
        response.status,
        parseRetryAfter(response.headers.get("retry-after"))
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") {
      throw new Error(`${this.options.name} returned an empty response`);
    }
    return content;
  }
}
