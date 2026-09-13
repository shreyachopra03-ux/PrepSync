import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { KitModel } from "../db/models/Kit";
import { PracticeModel, type PracticeConfidence } from "../db/models/Practice";

export const practiceRouter = Router();

practiceRouter.use(requireAuth);

const RECENCY_HALF_LIFE_HOURS = 24;

function recencyDecay(lastSeenAt: Date): number {
  const hoursSince = (Date.now() - lastSeenAt.getTime()) / (1000 * 60 * 60);
  return Math.pow(2, -hoursSince / RECENCY_HALF_LIFE_HOURS);
}

practiceRouter.get("/:kitId/next", async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const { kitId } = req.params;

    const kit = await KitModel.findOne({ _id: kitId, userId });
    if (!kit) {
      throw new HttpError(404, "Kit not found");
    }

    const practiceRecords = await PracticeModel.find({ kitId, userId });
    const practiceByCardId = new Map(practiceRecords.map((p) => [p.cardId, p]));

    const scored = kit.flashcards.map((card, index) => {
      const record = practiceByCardId.get(card.id);
      const seen = Boolean(record);
      const score = record ? record.confidence * recencyDecay(record.lastSeenAt) : -1;
      return { card, seen, score, index };
    });

    scored.sort((a, b) => {
      if (a.seen !== b.seen) return a.seen ? 1 : -1;
      if (a.score !== b.score) return a.score - b.score;
      return a.index - b.index;
    });

    const next = scored[0]?.card ?? null;

    const requirementIds = new Set(kit.role.requirements.map((r) => r.id));
    const coveredRequirementIds = new Set<string>();
    for (const record of practiceRecords) {
      const card = kit.flashcards.find((c) => c.id === record.cardId);
      card?.requirement_ids.forEach((id) => coveredRequirementIds.add(id));
    }
    const uncoveredRequirementIds = Array.from(requirementIds).filter(
      (id) => !coveredRequirementIds.has(id)
    );

    res.json({
      card: next,
      progress: {
        coveredRequirementIds: Array.from(coveredRequirementIds),
        uncoveredRequirementIds,
      },
    });
  } catch (error) {
    next(error);
  }
});

practiceRouter.post("/:kitId/:cardId", async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const { kitId, cardId } = req.params;
    const { confidence } = req.body ?? {};

    if (![1, 2, 3].includes(confidence)) {
      throw new HttpError(400, "confidence must be 1, 2, or 3");
    }

    const kit = await KitModel.findOne({ _id: kitId, userId });
    if (!kit) {
      throw new HttpError(404, "Kit not found");
    }
    if (!kit.flashcards.some((c) => c.id === cardId)) {
      throw new HttpError(404, "Flashcard not found in this kit");
    }

    const existing = await PracticeModel.findOne({ kitId, userId, cardId });

    if (existing) {
      existing.confidence = confidence as PracticeConfidence;
      existing.lastSeenAt = new Date();
      existing.timesSeen += 1;
      await existing.save();
      res.json({ practice: existing });
      return;
    }

    const created = await PracticeModel.create({
      kitId,
      userId,
      cardId,
      confidence: confidence as PracticeConfidence,
      lastSeenAt: new Date(),
      timesSeen: 1,
    });

    res.status(201).json({ practice: created });
  } catch (error) {
    next(error);
  }
});
