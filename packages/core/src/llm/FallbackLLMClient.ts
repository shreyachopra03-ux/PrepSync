import type { LLMClient } from "./LLMClient";

export interface NamedLLMClient {
  name: string;
  client: LLMClient;
}

const COOLDOWN_MS = 60_000;

export class FallbackLLMClient implements LLMClient {
  private cooldownUntil = new Map<string, number>();

  constructor(
    private providers: NamedLLMClient[],
    private now: () => number = Date.now
  ) {
    if (providers.length === 0) {
      throw new Error("FallbackLLMClient needs at least one provider");
    }
  }

  async generateText(prompt: string): Promise<string> {
    const failures: string[] = [];
    const ready = this.providers.filter((p) => (this.cooldownUntil.get(p.name) ?? 0) <= this.now());
    const cooling = this.providers.filter((p) => !ready.includes(p));

    for (const { name, client } of [...ready, ...cooling]) {
      try {
        const text = await client.generateText(prompt);
        this.cooldownUntil.delete(name);
        return text;
      } catch (error) {
        this.cooldownUntil.set(name, this.now() + COOLDOWN_MS);
        const reason = error instanceof Error ? error.message : String(error);
        failures.push(`${name}: ${reason}`);
      }
    }

    throw new Error(`All LLM providers failed (${failures.join(" | ")})`);
  }
}
