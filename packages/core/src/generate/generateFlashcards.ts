import { z } from "zod";
import type { LLMClient } from "../llm/LLMClient";
import { parseJsonWithRepair } from "../llm/repairJson";
import type { Requirement, Question, Flashcard } from "../validate/kitSchema";

const FlashcardDraftSchema = z.object({
  requirement_ids: z.array(z.string()),
  front: z.string(),
  back: z.string(),
});

const FlashcardDraftsSchema = z.array(FlashcardDraftSchema);

function buildPrompt(requirements: Requirement[], questions: Question[]): string {
  const requirementsList = requirements
    .map((r) => `- id: ${r.id}, priority: ${r.priority}, text: ${r.text}`)
    .join("\n");

  const questionsList = questions
    .map((q) => `- covers ${q.requirement_ids.join(", ")}: ${q.prompt} | ${q.answer_outline}`)
    .join("\n");

  return [
    "Create quick-recall flashcards (front/back) to help someone prepare for an interview.",
    "Every flashcard must reference at least one requirement id from the list below, via requirement_ids.",
    "Do not invent requirements that are not in the list.",
    "Front should be a short prompt or term; back should be a concise answer, not a full essay.",
    "Requirements:",
    requirementsList,
    "Existing interview questions (use as material, do not just copy them verbatim):",
    questionsList || "None generated yet.",
    "Return a JSON array only, no prose, no code fences, matching this shape:",
    '[{ "requirement_ids": string[], "front": string, "back": string }]',
  ].join("\n\n");
}

export async function generateFlashcards(
  requirements: Requirement[],
  questions: Question[],
  llmClient: LLMClient
): Promise<Flashcard[]> {
  const prompt = buildPrompt(requirements, questions);
  const rawText = await llmClient.generateText(prompt);
  const drafts = await parseJsonWithRepair(rawText, FlashcardDraftsSchema, llmClient, prompt);

  if (!drafts) return [];

  return drafts.map((draft, index) => ({
    id: `f${index + 1}`,
    front: draft.front,
    back: draft.back,
    requirement_ids: draft.requirement_ids,
    origin: "generated",
    pinned: false,
  }));
}
