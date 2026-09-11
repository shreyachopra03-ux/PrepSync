export interface User {
  _id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type RequirementKind = "technical" | "behavioural";
export type RequirementPriority = "must" | "nice";

export interface Requirement {
  id: string;
  text: string;
  kind: RequirementKind;
  priority: RequirementPriority;
};

export type ItemOrigin = "generated" | "edited" | "manual";

export interface Question {
  id: string;
  requirement_ids: string[];
  category: string;
  prompt: string;
  answer_outline: string;
  difficulty: 1 | 2 | 3;
  origin: ItemOrigin;
  pinned: boolean;
  order: number;
  rev: number;
};

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
  origin: ItemOrigin;
  pinned: boolean;
};

export interface ScheduleDay {
  day: number;
  focus: string;
  question_ids: string[];
  minutes: number;
};

export interface Schedule {
  days_available: number;
  days: ScheduleDay[];
};

export interface Coverage {
  uncovered_requirement_ids: string[];
  passes: number;
};

export interface Source {
  company: string;
  company_url: string;
  role: string;
  location: string;
  jd_chars: number;
  researched_at: string;
  pages_used: string[];
};

export interface CompanyBrief {
  summary: string;
  what_they_do: string;
  sources: string[];
};

export interface Role {
  title: string;
  seniority: string;
  responsibilities: string[];
  requirements: Requirement[];
};

export interface Kit {
  version: number;
  source: Source;
  company_brief: CompanyBrief;
  role: Role;
  questions: Question[];
  flashcards: Flashcard[];
  schedule: Schedule;
  coverage: Coverage;
};

export type RunStatus = "queued" | "running" | "done" | "failed";

export interface RunStep {
  name: string;
  status: RunStatus;
  startedAt: string;
  finishedAt: string;
  note: string;
};

export interface Run {
  userId: string;
  kitId: string;
  status: RunStatus;
  steps: RunStep[];
  idempotencyKey: string;
  error: string;
};

export type PracticeConfidence = 1 | 2 | 3;

export interface Practice {
  kitId: string;
  userId: string;
  cardId: string;
  confidence: PracticeConfidence;
  lastSeenAt: string;
  timesSeen: number;
};
