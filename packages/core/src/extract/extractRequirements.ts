import { z } from "zod";
import type { LLMClient } from "../llm/LLMClient";
import { parseJsonWithRepair } from "../llm/repairJson";
import {
  RequirementKindSchema,
  RequirementPrioritySchema,
  type Requirement,
  type Role,
} from "../validate/kitSchema";

const RequirementDraftSchema = z.object({
  text: z.string(),
  kind: RequirementKindSchema,
  priority: RequirementPrioritySchema,
});

const RoleDraftSchema = z.object({
  title: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(RequirementDraftSchema),
});

function buildPrompt(jd: string): string {
  return [
    "You are extracting structured hiring information from a job description.",
    "Rules:",
    "- Extract ONLY information that is explicitly stated or clearly implied in the text below.",
    "- Do NOT invent requirements, responsibilities, title, or seniority that are not present in the text.",
    "- If the job description is very short, return only the few items it actually contains; do not pad the lists.",
    "- Mark each requirement's kind as \"technical\" or \"behavioural\".",
    "- Mark each requirement's priority as \"must\" (explicitly required) or \"nice\" (preferred/bonus).",
    "Return a JSON object only, no prose, no code fences, matching this shape:",
    '{ "title": string, "seniority": string, "responsibilities": string[], "requirements": [{ "text": string, "kind": "technical" | "behavioural", "priority": "must" | "nice" }] }',
    "Job description:",
    jd,
  ].join("\n\n");
}

export async function extractRole(jd: string, llmClient: LLMClient): Promise<Role> {
  const prompt = buildPrompt(jd);
  const rawText = await llmClient.generateText(prompt);
  const draft = await parseJsonWithRepair(rawText, RoleDraftSchema, llmClient, prompt);

  if (!draft) {
    throw new Error(
      "extractRole: LLM could not produce a valid role/requirements extraction from the JD, even after repair"
    );
  }

  const requirements: Requirement[] = draft.requirements.map((r, index) => ({
    id: `r${index + 1}`,
    text: r.text,
    kind: r.kind,
    priority: r.priority,
  }));

  return {
    title: draft.title,
    seniority: draft.seniority,
    responsibilities: draft.responsibilities,
    requirements,
  };
}
