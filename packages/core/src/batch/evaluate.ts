import { readFile, writeFile } from "fs/promises";
import pLimit from "p-limit";
import { GeminiClient } from "../llm/GeminiClient";
import { runPipeline } from "../pipeline/runPipeline";
import type { Kit } from "../validate/kitSchema";

const DEFAULT_CONCURRENCY = 2;

interface EvaluationCase {
  id: string;
  jd: string;
  company_url: string;
  days: number;
}

interface KitResult {
  id: string;
  status: "ok" | "failed";
  kit: Kit | null;
  error: { code: string; message: string } | null;
}

interface OutputFile {
  version: number;
  generated_at: string;
  kits: KitResult[];
}

function parseArgs(argv: string[]): { input: string; output: string } {
  const inputIndex = argv.indexOf("--input");
  const outputIndex = argv.indexOf("--output");

  if (inputIndex === -1 || outputIndex === -1) {
    throw new Error("Usage: evaluate --input cases.json --output kits.json");
  }

  return { input: argv[inputIndex + 1], output: argv[outputIndex + 1] };
}

function deriveCompanyName(companyUrl: string): string {
  try {
    return new URL(companyUrl).hostname.replace(/^www\./, "");
  } catch {
    return companyUrl;
  }
}

async function runCase(evalCase: EvaluationCase, llmClient: GeminiClient): Promise<KitResult> {
  try {
    const result = await runPipeline({
      jd: evalCase.jd,
      companyUrl: evalCase.company_url,
      companyName: deriveCompanyName(evalCase.company_url),
      days: evalCase.days,
      llmClient,
    });

    return { id: evalCase.id, status: "ok", kit: result.kit, error: null };
  } catch (error) {
    return {
      id: evalCase.id,
      status: "failed",
      kit: null,
      error: {
        code: "PIPELINE_ERROR",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

async function main(): Promise<void> {
  const { input, output } = parseArgs(process.argv.slice(2));

  const rawCases = await readFile(input, "utf8");
  const cases: EvaluationCase[] = JSON.parse(rawCases);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const GEMINI_FLASH_FREE_TIER_RPM = 15;
  const GEMINI_FLASH_FREE_TIER_TPM = 250_000;
  const llmClient = new GeminiClient(apiKey, {
    requestsPerMinute: GEMINI_FLASH_FREE_TIER_RPM,
    tokensPerMinute: GEMINI_FLASH_FREE_TIER_TPM,
  });

  const concurrency = Number(process.env.EVALUATE_CONCURRENCY) || DEFAULT_CONCURRENCY;
  const limit = pLimit(concurrency);
  const results = await Promise.all(
    cases.map((evalCase) => limit(() => runCase(evalCase, llmClient)))
  );

  const outputFile: OutputFile = {
    version: 1,
    generated_at: new Date().toISOString(),
    kits: results,
  };

  await writeFile(output, JSON.stringify(outputFile, null, 2), "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
