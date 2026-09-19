import type { Kit, KitSummary, Run, User, PracticeProgress, Flashcard } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const USE_CLIENT_KDF = process.env.NEXT_PUBLIC_CLIENT_KDF === "true";
const KDF_ITERATIONS = 300_000;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function passwordProof(email: string, password: string): Promise<string> {
  if (!USE_CLIENT_KDF) return password;

  const salt = new TextEncoder().encode(`prepsync:v1:${email.trim().toLowerCase()}`);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: KDF_ITERATIONS },
    key,
    256
  );
  return toBase64Url(new Uint8Array(bits));
}

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

export async function register(email: string, password: string): Promise<{ user: User }> {
  const proof = await passwordProof(email, password);
  return request("/auth/register", { method: "POST", body: JSON.stringify({ email, password: proof }) });
}

export async function login(email: string, password: string): Promise<{ user: User }> {
  const proof = await passwordProof(email, password);
  return request("/auth/login", { method: "POST", body: JSON.stringify({ email, password: proof }) });
}

export function logout(): Promise<{ ok: boolean }> {
  return request("/auth/logout", { method: "POST" });
}

export function getCurrentUser(): Promise<{ user: User }> {
  return request("/auth/me");
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
