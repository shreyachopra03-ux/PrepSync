import { z } from "zod";
import type { LLMClient } from "../llm/LLMClient";
import { parseJsonWithRepair } from "../llm/repairJson";
import type { Requirement, Question } from "../validate/kitSchema";

const QuestionDraftSchema = z.object({
  requirement_ids: z.array(z.string()),
  category: z.string(),
  prompt: z.string(),
  answer_outline: z.string(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

const QuestionDraftsSchema = z.array(QuestionDraftSchema);

function buildPrompt(uncoveredRequirements: Requirement[]): string {
  const requirementsList = uncoveredRequirements
    .map((r) => `- id: ${r.id}, priority: ${r.priority}, text: ${r.text}`)
    .join("\n");

  return [
    "The following requirements are not yet covered by any interview question.",
    "Write at least one question for each of them.",
    "Every question must reference at least one requirement id from the list below, via requirement_ids.",
    "Do not invent requirements that are not in the list.",
    "Requirements:",
    requirementsList,
    "Return a JSON array only, no prose, no code fences, matching this shape:",
    '[{ "requirement_ids": string[], "category": string, "prompt": string, "answer_outline": string, "difficulty": 1 | 2 | 3 }]',
  ].join("\n\n");
}

export async function fillGaps(
  uncoveredIds: string[],
  allRequirements: Requirement[],
  startingOrder: number,
  llmClient: LLMClient
): Promise<Question[]> {
  const uncoveredRequirements = allRequirements.filter((r) => uncoveredIds.includes(r.id));
  if (uncoveredRequirements.length === 0) return [];

  const prompt = buildPrompt(uncoveredRequirements);
  const rawText = await llmClient.generateText(prompt);
  const drafts = await parseJsonWithRepair(rawText, QuestionDraftsSchema, llmClient, prompt);

  if (!drafts) return [];

  return drafts.map((draft, index) => ({
    id: `q-gap-${startingOrder + index + 1}`,
    requirement_ids: draft.requirement_ids,
    category: draft.category,
    prompt: draft.prompt,
    answer_outline: draft.answer_outline,
    difficulty: draft.difficulty,
    origin: "generated",
    pinned: false,
    order: startingOrder + index,
    rev: 1,
  }));
}
