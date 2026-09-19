import { Hono } from "hono";
import { findKitRow, nowIso, parseKitData } from "../db";
import { HttpError } from "../errors";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

interface PracticeRow {
  kit_id: string;
  user_id: string;
  card_id: string;
  confidence: number;
  last_seen_at: string;
  times_seen: number;
}

const RECENCY_HALF_LIFE_HOURS = 24;

function recencyDecay(lastSeenAt: string): number {
  const hoursSince = (Date.now() - new Date(lastSeenAt).getTime()) / (1000 * 60 * 60);
  return Math.pow(2, -hoursSince / RECENCY_HALF_LIFE_HOURS);
}

export const practiceRoutes = new Hono<AppEnv>();

practiceRoutes.use("*", requireAuth);

practiceRoutes.get("/:kitId/next", async (c) => {
  const userId = c.get("userId");
  const kitId = c.req.param("kitId");

  const kitRow = await findKitRow(c.env.DB, kitId, userId);
  if (!kitRow) {
    throw new HttpError(404, "Kit not found");
  }
  const kit = parseKitData(kitRow);

  const { results: practiceRecords } = await c.env.DB.prepare(
    "SELECT * FROM practice WHERE kit_id = ? AND user_id = ?"
  )
    .bind(kitId, userId)
    .all<PracticeRow>();
  const practiceByCardId = new Map(practiceRecords.map((record) => [record.card_id, record]));

  const scored = kit.flashcards.map((card, index) => {
    const record = practiceByCardId.get(card.id);
    const seen = Boolean(record);
    const score = record ? record.confidence * recencyDecay(record.last_seen_at) : -1;
    return { card, seen, score, index };
  });

  scored.sort((a, b) => {
    if (a.seen !== b.seen) return a.seen ? 1 : -1;
    if (a.score !== b.score) return a.score - b.score;
    return a.index - b.index;
  });

  const coveredRequirementIds = new Set<string>();
  for (const record of practiceRecords) {
    const card = kit.flashcards.find((flashcard) => flashcard.id === record.card_id);
    card?.requirement_ids.forEach((id) => coveredRequirementIds.add(id));
  }
  const uncoveredRequirementIds = kit.role.requirements
    .map((requirement) => requirement.id)
    .filter((id) => !coveredRequirementIds.has(id));

  return c.json({
    card: scored[0]?.card ?? null,
    progress: {
      coveredRequirementIds: Array.from(coveredRequirementIds),
      uncoveredRequirementIds,
    },
  });
});

practiceRoutes.post("/:kitId/:cardId", async (c) => {
  const userId = c.get("userId");
  const { kitId, cardId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const confidence = body?.confidence;

  if (![1, 2, 3].includes(confidence)) {
    throw new HttpError(400, "confidence must be 1, 2, or 3");
  }

  const kitRow = await findKitRow(c.env.DB, kitId, userId);
  if (!kitRow) {
    throw new HttpError(404, "Kit not found");
  }
  if (!parseKitData(kitRow).flashcards.some((card) => card.id === cardId)) {
    throw new HttpError(404, "Flashcard not found in this kit");
  }

  const practice = await c.env.DB.prepare(
    `INSERT INTO practice (kit_id, user_id, card_id, confidence, last_seen_at, times_seen)
     VALUES (?, ?, ?, ?, ?, 1)
     ON CONFLICT(kit_id, user_id, card_id) DO UPDATE SET
       confidence = excluded.confidence,
       last_seen_at = excluded.last_seen_at,
       times_seen = practice.times_seen + 1
     RETURNING *`
  )
    .bind(kitId, userId, cardId, confidence, nowIso())
    .first<PracticeRow>();

  if (!practice) {
    throw new HttpError(500, "Failed to save practice result");
  }

  return c.json(
    {
      practice: {
        kitId: practice.kit_id,
        userId: practice.user_id,
        cardId: practice.card_id,
        confidence: practice.confidence,
        lastSeenAt: practice.last_seen_at,
        timesSeen: practice.times_seen,
      },
    },
    practice.times_seen === 1 ? 201 : 200
  );
});
