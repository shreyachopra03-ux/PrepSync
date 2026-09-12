import type { ZodType } from "zod";
import type { LLMClient } from "./LLMClient";

export function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function tryParse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function repairAndReparse<T>(
  rawText: string,
  schema: ZodType<T>,
  llmClient: LLMClient,
  originalPrompt: string,
  errorMessage: string
): Promise<T | null> {
  const repairPrompt = buildRepairPrompt(originalPrompt, rawText, errorMessage);
  const repairedText = await llmClient.generateText(repairPrompt);
  const repairedJson = tryParse(stripCodeFences(repairedText));
  if (repairedJson === null) {
    return null;
  }

  const repairedParsed = schema.safeParse(repairedJson);
  return repairedParsed.success ? repairedParsed.data : null;
}

export async function parseJsonWithRepair<T>(
  rawText: string,
  schema: ZodType<T>,
  llmClient: LLMClient,
  originalPrompt: string
): Promise<T | null> {
  const firstAttempt = tryParse(stripCodeFences(rawText));

  if (firstAttempt === null) {
    return repairAndReparse(rawText, schema, llmClient, originalPrompt, "response was not valid JSON");
  }

  const parsed = schema.safeParse(firstAttempt);
  if (parsed.success) {
    return parsed.data;
  }

  return repairAndReparse(rawText, schema, llmClient, originalPrompt, parsed.error.message);
}

function buildRepairPrompt(originalPrompt: string, badOutput: string, errorMessage: string): string {
  return [
    "The previous response did not match the required JSON schema.",
    `Validation error: ${errorMessage}`,
    "Previous response:",
    badOutput,
    "Original instructions:",
    originalPrompt,
    "Return only corrected JSON that satisfies the schema. No prose, no code fences.",
  ].join("\n\n");
}
