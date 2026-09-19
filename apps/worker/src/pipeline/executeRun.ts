import { GeminiClient, type PipelineLimits, type PipelineStepName } from "@prepsync/core";
import { newId } from "../crypto";
import { nowIso } from "../db";
import type { Env } from "../types";

const GEMINI_FLASH_FREE_TIER_RPM = 15;
const GEMINI_FLASH_FREE_TIER_TPM = 250_000;

export const WORKER_LIMITS: PipelineLimits = {
  maxPages: 12,
  maxDepth: 2,
  crawlConcurrency: 1,
  maxPageBytes: 600_000,
  hiringCandidates: 3,
  allowHiringRefetch: false,
};

interface StoredStep {
  name: string;
  status: "running" | "done" | "failed";
  startedAt: string;
  finishedAt: string;
  note: string;
}

let cachedClient: { key: string; client: GeminiClient } | null = null;

export function getLlmClient(env: Env): GeminiClient {
  const key = `${env.GEMINI_API_KEY}|${env.GEMINI_BASE_URL ?? ""}`;
  if (!cachedClient || cachedClient.key !== key) {
    cachedClient = {
      key,
      client: new GeminiClient(env.GEMINI_API_KEY, {
        baseUrl: env.GEMINI_BASE_URL,
        requestsPerMinute: GEMINI_FLASH_FREE_TIER_RPM,
        tokensPerMinute: GEMINI_FLASH_FREE_TIER_TPM,
      }),
    };
  }
  return cachedClient.client;
}

export async function markRunRunning(db: D1Database, runId: string): Promise<void> {
  await db
    .prepare("UPDATE runs SET status = 'running', updated_at = ? WHERE id = ?")
    .bind(nowIso(), runId)
    .run();
}

export async function upsertStep(
  db: D1Database,
  runId: string,
  name: PipelineStepName,
  status: "running" | "done" | "failed",
  note?: string
): Promise<void> {
  const row = await db
    .prepare("SELECT steps FROM runs WHERE id = ?")
    .bind(runId)
    .first<{ steps: string }>();
  const steps: StoredStep[] = row ? JSON.parse(row.steps) : [];

  const now = nowIso();
  const existing = steps.find((step) => step.name === name);

  if (existing) {
    existing.status = status;
    if (note) existing.note = note;
    if (status !== "running") existing.finishedAt = now;
  } else {
    steps.push({
      name,
      status,
      startedAt: now,
      finishedAt: status === "running" ? "" : now,
      note: note ?? "",
    });
  }

  await db
    .prepare("UPDATE runs SET steps = ?, updated_at = ? WHERE id = ?")
    .bind(JSON.stringify(steps), now, runId)
    .run();
}

export async function markRunFailed(db: D1Database, runId: string, message: string): Promise<void> {
  await db
    .prepare(
      "UPDATE runs SET status = 'failed', error = ?, updated_at = ? WHERE id = ? AND status IN ('queued', 'running')"
    )
    .bind(message, nowIso(), runId)
    .run();
}

export async function saveKit(
  db: D1Database,
  runId: string,
  userId: string,
  kitData: Record<string, unknown>
): Promise<string> {
  const kitId = newId();
  const now = nowIso();

  await db.batch([
    db
      .prepare(
        "INSERT INTO kits (id, user_id, version, data, created_at, updated_at) VALUES (?, ?, 1, ?, ?, ?)"
      )
      .bind(kitId, userId, JSON.stringify(kitData), now, now),
    db
      .prepare("UPDATE runs SET status = 'done', kit_id = ?, updated_at = ? WHERE id = ?")
      .bind(kitId, now, runId),
  ]);

  return kitId;
}
