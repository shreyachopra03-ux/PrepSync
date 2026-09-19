import { Hono } from "hono";
import {
  KitSchema,
  buildSchedule,
  checkCoverage,
  generateFlashcards,
  generateQuestions,
  mergeFlashcards,
  mergeQuestions,
} from "@prepsync/core";
import { newId } from "../crypto";
import { findKitRow, kitFromRow, nowIso, parseKitData, type KitRow, type RunRow } from "../db";
import { HttpError } from "../errors";
import { requireAuth } from "../middleware/auth";
import { getLlmClient } from "../pipeline/executeRun";
import type { AppEnv, RunParams } from "../types";
import { computeIdempotencyKey } from "../utils/idempotency";
import { validateCompanyUrl } from "../utils/ssrf";

const MAX_DAYS = 365;
const PATCHABLE_FIELDS = ["questions", "flashcards", "role", "company_brief", "schedule"] as const;

const STALE_VERSION_MESSAGE = "Kit has changed since you last loaded it; refresh and retry";

export const kitsRoutes = new Hono<AppEnv>();

kitsRoutes.use("*", requireAuth);

kitsRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const { jd, company_url, company_name, days } = body ?? {};

  if (typeof jd !== "string" || jd.trim().length === 0) {
    throw new HttpError(400, "jd is required");
  }
  if (typeof company_url !== "string") {
    throw new HttpError(400, "company_url is required");
  }
  if (typeof days !== "number" || !Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
    throw new HttpError(400, `days must be a whole number between 1 and ${MAX_DAYS}`);
  }

  const urlCheck = validateCompanyUrl(company_url, c.env);
  if (!urlCheck.valid) {
    throw new HttpError(400, urlCheck.reason ?? "company_url is invalid");
  }

  const companyName =
    typeof company_name === "string" && company_name.trim().length > 0
      ? company_name.trim()
      : new URL(company_url).hostname.replace(/^www\./, "");

  const idempotencyKey = await computeIdempotencyKey(userId, jd, company_url);
  const now = nowIso();

  const existing = await c.env.DB.prepare("SELECT * FROM runs WHERE idempotency_key = ?")
    .bind(idempotencyKey)
    .first<RunRow>();

  if (existing && existing.status !== "failed") {
    return c.json({ runId: existing.id, status: existing.status });
  }

  let runId: string;
  if (existing) {
    runId = existing.id;
    await c.env.DB.prepare(
      "UPDATE runs SET status = 'queued', steps = '[]', error = NULL, kit_id = NULL, updated_at = ? WHERE id = ?"
    )
      .bind(now, runId)
      .run();
  } else {
    runId = newId();
    try {
      await c.env.DB.prepare(
        `INSERT INTO runs (id, user_id, kit_id, status, steps, idempotency_key, error, created_at, updated_at)
         VALUES (?, ?, NULL, 'queued', '[]', ?, NULL, ?, ?)`
      )
        .bind(runId, userId, idempotencyKey, now, now)
        .run();
    } catch {
      const raced = await c.env.DB.prepare("SELECT * FROM runs WHERE idempotency_key = ?")
        .bind(idempotencyKey)
        .first<RunRow>();
      if (raced) {
        return c.json({ runId: raced.id, status: raced.status });
      }
      throw new HttpError(500, "Could not create the run");
    }
  }

  const params: RunParams = { runId, userId, jd, companyUrl: company_url, companyName, days };

  try {
    await c.env.RUN_WORKFLOW.create({ id: `${runId}-${Date.now()}`, params });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await c.env.DB.prepare("UPDATE runs SET status = 'failed', error = ?, updated_at = ? WHERE id = ?")
      .bind(`Could not start generation: ${message}`, nowIso(), runId)
      .run();
    throw new HttpError(500, "Could not start generation");
  }

  return c.json({ runId, status: "queued" }, 202);
});

interface KitSummaryRow {
  id: string;
  version: number;
  created_at: string;
  updated_at: string;
  company: string | null;
  role_title: string | null;
  days_available: number | null;
  question_count: number | null;
  flashcard_count: number | null;
  uncovered_count: number | null;
}

kitsRoutes.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, version, created_at, updated_at,
            json_extract(data, '$.source.company') AS company,
            json_extract(data, '$.role.title') AS role_title,
            json_extract(data, '$.schedule.days_available') AS days_available,
            json_array_length(data, '$.questions') AS question_count,
            json_array_length(data, '$.flashcards') AS flashcard_count,
            json_array_length(data, '$.coverage.uncovered_requirement_ids') AS uncovered_count
     FROM kits WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`
  )
    .bind(c.get("userId"))
    .all<KitSummaryRow>();

  return c.json({
    kits: results.map((row) => ({
      _id: row.id,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      source: { company: row.company ?? "" },
      role: { title: row.role_title ?? "" },
      schedule: { days_available: row.days_available ?? 0 },
      questionCount: row.question_count ?? 0,
      flashcardCount: row.flashcard_count ?? 0,
      uncoveredCount: row.uncovered_count ?? 0,
    })),
  });
});

kitsRoutes.get("/:id", async (c) => {
  const row = await findKitRow(c.env.DB, c.req.param("id"), c.get("userId"));
  if (!row) {
    throw new HttpError(404, "Kit not found");
  }
  return c.json({ kit: kitFromRow(row) });
});

kitsRoutes.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const row = await findKitRow(c.env.DB, id, userId);
  if (!row) {
    throw new HttpError(404, "Kit not found");
  }

  const ifMatch = c.req.header("If-Match");
  if (!ifMatch || Number(ifMatch) !== row.version) {
    throw new HttpError(409, STALE_VERSION_MESSAGE);
  }

  const body = await c.req.json().catch(() => ({}));
  const data = parseKitData(row) as Record<string, unknown>;
  let changed = false;

  for (const field of PATCHABLE_FIELDS) {
    if (body && field in body) {
      const parsed = KitSchema.shape[field].safeParse(body[field]);
      if (!parsed.success) {
        throw new HttpError(400, `Invalid ${field}: ${parsed.error.issues[0]?.message ?? "bad shape"}`);
      }
      data[field] = parsed.data;
      changed = true;
    }
  }

  if (!changed) {
    throw new HttpError(400, "No editable fields provided");
  }

  const result = await c.env.DB.prepare(
    "UPDATE kits SET data = ?, version = version + 1, updated_at = ? WHERE id = ? AND user_id = ? AND version = ?"
  )
    .bind(JSON.stringify(data), nowIso(), id, userId, row.version)
    .run();

  if (result.meta.changes === 0) {
    throw new HttpError(409, STALE_VERSION_MESSAGE);
  }

  const updated = await findKitRow(c.env.DB, id, userId);
  return c.json({ kit: kitFromRow(updated as KitRow) });
});

kitsRoutes.post("/:id/regenerate/:section", async (c) => {
  const userId = c.get("userId");
  const { id, section } = c.req.param();

  if (section !== "questions" && section !== "flashcards") {
    throw new HttpError(400, "section must be 'questions' or 'flashcards'");
  }

  const row = await findKitRow(c.env.DB, id, userId);
  if (!row) {
    throw new HttpError(404, "Kit not found");
  }

  const ifMatch = c.req.header("If-Match");
  if (!ifMatch || Number(ifMatch) !== row.version) {
    throw new HttpError(409, STALE_VERSION_MESSAGE);
  }

  const kit = parseKitData(row);
  const llmClient = getLlmClient(c.env);

  if (section === "questions") {
    const fresh = await generateQuestions(kit.role.requirements, null, llmClient);
    kit.questions = mergeQuestions(kit.questions, fresh);
  } else {
    const fresh = await generateFlashcards(kit.role.requirements, kit.questions, llmClient);
    kit.flashcards = mergeFlashcards(kit.flashcards, fresh);
  }

  kit.coverage.uncovered_requirement_ids = checkCoverage(kit.role.requirements, kit.questions);
  kit.schedule = buildSchedule(kit.role.requirements, kit.questions, kit.schedule.days_available);

  const result = await c.env.DB.prepare(
    "UPDATE kits SET data = ?, version = version + 1, updated_at = ? WHERE id = ? AND user_id = ? AND version = ?"
  )
    .bind(JSON.stringify(kit), nowIso(), id, userId, row.version)
    .run();

  if (result.meta.changes === 0) {
    throw new HttpError(409, STALE_VERSION_MESSAGE);
  }

  const updated = await findKitRow(c.env.DB, id, userId);
  return c.json({ kit: kitFromRow(updated as KitRow) });
});
