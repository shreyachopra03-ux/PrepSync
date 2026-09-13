import pLimit from "p-limit";
import { GeminiClient, runPipeline, type PipelineStepName } from "@prepsync/core";
import { env } from "../config/env";
import { RunModel, type RunStepSubdocument } from "../db/models/Run";
import { KitModel } from "../db/models/Kit";
import { Types } from "mongoose";

const QUEUE_CONCURRENCY = 2;
const GEMINI_FLASH_FREE_TIER_RPM = 15;
const GEMINI_FLASH_FREE_TIER_TPM = 250_000;

const limit = pLimit(QUEUE_CONCURRENCY);

export interface QueueRunInput {
  runId: string;
  userId: string;
  jd: string;
  companyUrl: string;
  companyName: string;
  days: number;
}

async function upsertStep(
  runId: string,
  name: PipelineStepName,
  status: "running" | "done" | "failed",
  note?: string
): Promise<void> {
  const run = await RunModel.findById(runId);
  if (!run) return;

  const nowIso = new Date().toISOString();
  const existing = run.steps.find((s: RunStepSubdocument) => s.name === name);

  if (existing) {
    existing.status = status;
    existing.note = note ?? existing.note;
    if (status === "done" || status === "failed") {
      existing.finishedAt = nowIso;
    }
  } else {
    run.steps.push({
      name,
      status,
      startedAt: nowIso,
      finishedAt: status === "running" ? "" : nowIso,
      note: note ?? "",
    });
  }

  await run.save();
}

async function processRun(input: QueueRunInput): Promise<void> {
  const { runId, userId, jd, companyUrl, companyName, days } = input;

  await RunModel.findByIdAndUpdate(runId, { status: "running" });

  const llmClient = new GeminiClient(env.GEMINI_API_KEY, {
    requestsPerMinute: GEMINI_FLASH_FREE_TIER_RPM,
    tokensPerMinute: GEMINI_FLASH_FREE_TIER_TPM,
  });

  try {
    const result = await runPipeline({
      jd,
      companyUrl,
      companyName,
      days,
      llmClient,
      onStep: (step, status, note) => upsertStep(runId, step, status, note),
    });

    const kit = await KitModel.create({
      userId: new Types.ObjectId(userId),
      ...result.kit,
    });

    await RunModel.findByIdAndUpdate(runId, {
      status: "done",
      kitId: kit._id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await RunModel.findByIdAndUpdate(runId, {
      status: "failed",
      error: message,
    });
  }
}

export function queueRun(input: QueueRunInput): void {
  limit(() => processRun(input)).catch((error) => {
    console.error(`Unhandled error processing run ${input.runId}:`, error);
  });
}
