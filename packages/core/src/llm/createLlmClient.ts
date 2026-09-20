import type { LLMClient } from "./LLMClient";
import { FallbackLLMClient, type NamedLLMClient } from "./FallbackLLMClient";
import { OpenAICompatibleClient } from "./OpenAICompatibleClient";
import { GeminiClient } from "./GeminiClient";

export const NVIDIA_MODEL = "openai/gpt-oss-20b";
export const GROQ_MODEL = "openai/gpt-oss-20b";

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export interface LlmProvidersConfig {
  nvidiaApiKey?: string;
  groqApiKey?: string;
  geminiApiKey?: string;
  nvidiaBaseUrl?: string;
  groqBaseUrl?: string;
  geminiBaseUrl?: string;
}

export function createLlmClient(config: LlmProvidersConfig): LLMClient {
  const providers: NamedLLMClient[] = [];

  if (config.nvidiaApiKey) {
    providers.push({
      name: "nvidia",
      client: new OpenAICompatibleClient(config.nvidiaApiKey, {
        name: "nvidia",
        baseUrl: config.nvidiaBaseUrl ?? NVIDIA_BASE_URL,
        model: NVIDIA_MODEL,
        requestsPerMinute: 40,
        tokensPerMinute: 200_000,
      }),
    });
  }

  if (config.groqApiKey) {
    providers.push({
      name: "groq",
      client: new OpenAICompatibleClient(config.groqApiKey, {
        name: "groq",
        baseUrl: config.groqBaseUrl ?? GROQ_BASE_URL,
        model: GROQ_MODEL,
        requestsPerMinute: 30,
        tokensPerMinute: 8_000,
      }),
    });
  }

  if (config.geminiApiKey) {
    providers.push({
      name: "gemini",
      client: new GeminiClient(config.geminiApiKey, {
        baseUrl: config.geminiBaseUrl,
        requestsPerMinute: 15,
        tokensPerMinute: 250_000,
      }),
    });
  }

  if (providers.length === 0) {
    throw new Error("No LLM provider configured: set NVIDIA_API_KEY, GROQ_API_KEY or GEMINI_API_KEY");
  }

  return new FallbackLLMClient(providers);
}
