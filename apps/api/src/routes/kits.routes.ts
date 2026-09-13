import { Router } from "express";
import { Types } from "mongoose";
import {
  GeminiClient,
  generateQuestions,
  generateFlashcards,
  mergeQuestions,
  mergeFlashcards,
  checkCoverage,
  buildSchedule,
} from "@prepsync/core";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";
import { validateCompanyUrl } from "../utils/ssrf";
import { computeIdempotencyKey } from "../utils/idempotency";
import { HttpError } from "../middleware/errorHandler";
import { KitModel } from "../db/models/Kit";
import { RunModel } from "../db/models/Run";
import { queueRun } from "../queue/runQueue";

const GEMINI_FLASH_FREE_TIER_RPM = 15;
const GEMINI_FLASH_FREE_TIER_TPM = 250_000;

export const kitsRouter = Router();

kitsRouter.use(requireAuth);

kitsRouter.post("/", async (req, res, next) => {
  try {
    const { jd, company_url, company_name, days } = req.body ?? {};

    if (typeof jd !== "string" || jd.trim().length === 0) {
      throw new HttpError(400, "jd is required");
    }
    if (typeof company_url !== "string") {
      throw new HttpError(400, "company_url is required");
    }
    if (typeof days !== "number" || days < 1) {
      throw new HttpError(400, "days must be a positive number");
    }

    const urlCheck = validateCompanyUrl(company_url);
    if (!urlCheck.valid) {
      throw new HttpError(400, urlCheck.reason ?? "company_url is invalid");
    }

    const userId = req.auth!.userId;
    const companyName =
      typeof company_name === "string" && company_name.trim().length > 0
        ? company_name
        : new URL(company_url).hostname.replace(/^www\./, "");

    const idempotencyKey = computeIdempotencyKey(userId, jd, company_url);

    const existingRun = await RunModel.findOne({ idempotencyKey });
    if (existingRun) {
      res.status(200).json({ runId: existingRun._id, status: existingRun.status });
      return;
    }

    const run = await RunModel.create({
      userId: new Types.ObjectId(userId),
      kitId: null,
      status: "queued",
      steps: [],
      idempotencyKey,
      error: null,
    });

    queueRun({
      runId: run._id.toString(),
      userId,
      jd,
      companyUrl: company_url,
      companyName,
      days,
    });

    res.status(202).json({ runId: run._id, status: run.status });
  } catch (error) {
    next(error);
  }
});

kitsRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const kits = await KitModel.find({ userId }).sort({ createdAt: -1 });
    res.json({ kits });
  } catch (error) {
    next(error);
  }
});

kitsRouter.get("/:id", async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const kit = await KitModel.findOne({ _id: req.params.id, userId });
    if (!kit) {
      throw new HttpError(404, "Kit not found");
    }
    res.json({ kit });
  } catch (error) {
    next(error);
  }
});

kitsRouter.patch("/:id", async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const ifMatch = req.get("If-Match");

    const kit = await KitModel.findOne({ _id: req.params.id, userId });
    if (!kit) {
      throw new HttpError(404, "Kit not found");
    }

    if (!ifMatch || Number(ifMatch) !== kit.version) {
      throw new HttpError(409, "Kit has changed since you last loaded it; refresh and retry");
    }

    const allowedFields = ["questions", "flashcards", "role", "company_brief", "schedule"];
    for (const field of allowedFields) {
      if (field in (req.body ?? {})) {
        (kit as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    }

    kit.version += 1;
    await kit.save();

    res.json({ kit });
  } catch (error) {
    next(error);
  }
});

kitsRouter.post("/:id/regenerate/:section", async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const { section } = req.params;
    const ifMatch = req.get("If-Match");

    if (section !== "questions" && section !== "flashcards") {
      throw new HttpError(400, "section must be 'questions' or 'flashcards'");
    }

    const kit = await KitModel.findOne({ _id: req.params.id, userId });
    if (!kit) {
      throw new HttpError(404, "Kit not found");
    }

    if (!ifMatch || Number(ifMatch) !== kit.version) {
      throw new HttpError(409, "Kit has changed since you last loaded it; refresh and retry");
    }

    const llmClient = new GeminiClient(env.GEMINI_API_KEY, {
      requestsPerMinute: GEMINI_FLASH_FREE_TIER_RPM,
      tokensPerMinute: GEMINI_FLASH_FREE_TIER_TPM,
    });

    if (section === "questions") {
      const freshQuestions = await generateQuestions(kit.role.requirements, null, llmClient);
      kit.questions = mergeQuestions(kit.questions, freshQuestions);
    } else {
      const freshFlashcards = await generateFlashcards(
        kit.role.requirements,
        kit.questions,
        llmClient
      );
      kit.flashcards = mergeFlashcards(kit.flashcards, freshFlashcards);
    }

    kit.coverage.uncovered_requirement_ids = checkCoverage(kit.role.requirements, kit.questions);
    kit.schedule = buildSchedule(kit.role.requirements, kit.questions, kit.schedule.days_available);
    kit.version += 1;

    await kit.save();

    res.json({ kit });
  } catch (error) {
    next(error);
  }
});
