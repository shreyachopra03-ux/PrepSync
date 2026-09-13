export type RequirementKind = "technical" | "behavioural";
export type RequirementPriority = "must" | "nice";
export type ItemOrigin = "generated" | "edited" | "manual";
export type RunStatus = "queued" | "running" | "done" | "failed";

export interface Requirement {
  id: string;
  text: string;
  kind: RequirementKind;
  priority: RequirementPriority;
}

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
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
  origin: ItemOrigin;
  pinned: boolean;
}

export interface ScheduleDay {
  day: number;
  focus: string;
  question_ids: string[];
  minutes: number;
}

export interface Schedule {
  days_available: number;
  days: ScheduleDay[];
}

export interface Coverage {
  uncovered_requirement_ids: string[];
  passes: number;
}

export interface Source {
  company: string;
  company_url: string;
  role: string;
  location: string;
  jd_chars: number;
  researched_at: string;
  pages_used: string[];
}

export interface CompanyBrief {
  summary: string;
  what_they_do: string;
  sources: string[];
}

export interface Role {
  title: string;
  seniority: string;
  responsibilities: string[];
  requirements: Requirement[];
}

export interface Kit {
  _id: string;
  version: number;
  source: Source;
  company_brief: CompanyBrief;
  role: Role;
  questions: Question[];
  flashcards: Flashcard[];
  schedule: Schedule;
  coverage: Coverage;
}

export interface RunStep {
  name: string;
  status: RunStatus;
  startedAt: string;
  finishedAt: string;
  note: string;
}

export interface Run {
  runId: string;
  kitId: string | null;
  status: RunStatus;
  steps: RunStep[];
  error: string | null;
}

export interface User {
  id: string;
  email: string;
}

export interface PracticeProgress {
  coveredRequirementIds: string[];
  uncoveredRequirementIds: string[];
}
