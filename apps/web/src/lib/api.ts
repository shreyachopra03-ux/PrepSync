import type { Kit, KitSummary, Run, PracticeProgress, Flashcard } from "./types";

const API_BASE_URL = "/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, body.error ?? "Something went wrong");
  }

  return body as T;
}

export interface CreateKitInput {
  jd: string;
  company_url: string;
  company_name?: string;
  days: number;
}

export function createKit(input: CreateKitInput): Promise<{ runId: string; status: string }> {
  return request("/kits", { method: "POST", body: JSON.stringify(input) });
}

export function listKits(): Promise<{ kits: KitSummary[] }> {
  return request("/kits");
}

export function getKit(kitId: string): Promise<{ kit: Kit }> {
  return request(`/kits/${kitId}`);
}

export function patchKit(
  kitId: string,
  version: number,
  changes: Partial<Kit>
): Promise<{ kit: Kit }> {
  return request(`/kits/${kitId}`, {
    method: "PATCH",
    headers: { "If-Match": String(version) },
    body: JSON.stringify(changes),
  });
}

export function regenerateSection(
  kitId: string,
  section: "questions" | "flashcards",
  version: number
): Promise<{ kit: Kit }> {
  return request(`/kits/${kitId}/regenerate/${section}`, {
    method: "POST",
    headers: { "If-Match": String(version) },
  });
}

export function getRun(runId: string): Promise<Run> {
  return request(`/runs/${runId}`);
}

export function getNextPracticeCard(
  kitId: string
): Promise<{ card: Flashcard | null; progress: PracticeProgress }> {
  return request(`/practice/${kitId}/next`);
}

export function submitPracticeConfidence(
  kitId: string,
  cardId: string,
  confidence: 1 | 2 | 3
): Promise<{ practice: unknown }> {
  return request(`/practice/${kitId}/${cardId}`, {
    method: "POST",
    body: JSON.stringify({ confidence }),
  });
}
