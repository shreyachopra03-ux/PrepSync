import { z } from "zod";

export const RequirementKindSchema = z.enum(["technical", "behavioural"]);
export const RequirementPrioritySchema = z.enum(["must", "nice"]);

export const RequirementSchema = z.object({
  id: z.string(),
  text: z.string(),
  kind: RequirementKindSchema,
  priority: RequirementPrioritySchema,
});

export type RequirementKind = z.infer<typeof RequirementKindSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;

export const ItemOriginSchema = z.enum(["generated", "edited", "manual"]);
export type ItemOrigin = z.infer<typeof ItemOriginSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  requirement_ids: z.array(z.string()),
  category: z.string(),
  prompt: z.string(),
  answer_outline: z.string(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  origin: ItemOriginSchema,
  pinned: z.boolean(),
  order: z.number(),
  rev: z.number(),
});

export type Question = z.infer<typeof QuestionSchema>;

export const FlashcardSchema = z.object({
  id: z.string(),
  front: z.string(),
  back: z.string(),
  requirement_ids: z.array(z.string()),
  origin: ItemOriginSchema,
  pinned: z.boolean(),
});

export type Flashcard = z.infer<typeof FlashcardSchema>;

export const ScheduleDaySchema = z.object({
  day: z.number(),
  focus: z.string(),
  question_ids: z.array(z.string()),
  minutes: z.number().int(),
});

export const ScheduleSchema = z.object({
  days_available: z.number(),
  days: z.array(ScheduleDaySchema),
});

export type ScheduleDay = z.infer<typeof ScheduleDaySchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;

export const CoverageSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()),
  passes: z.number(),
});

export type Coverage = z.infer<typeof CoverageSchema>;

export const SourceSchema = z.object({
  company: z.string(),
  company_url: z.string(),
  role: z.string(),
  location: z.string(),
  jd_chars: z.number(),
  researched_at: z.string(),
  pages_used: z.array(z.string()),
});

export type Source = z.infer<typeof SourceSchema>;

export const CompanyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
  sources: z.array(z.string()),
});

export type CompanyBrief = z.infer<typeof CompanyBriefSchema>;

export const RoleSchema = z.object({
  title: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(RequirementSchema),
});

export type Role = z.infer<typeof RoleSchema>;

export const KitSchema = z.object({
  version: z.number(),
  source: SourceSchema,
  company_brief: CompanyBriefSchema,
  role: RoleSchema,
  questions: z.array(QuestionSchema),
  flashcards: z.array(FlashcardSchema),
  schedule: ScheduleSchema,
  coverage: CoverageSchema,
});

export type Kit = z.infer<typeof KitSchema>;
