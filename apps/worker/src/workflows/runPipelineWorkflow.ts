import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { runPipeline, type PipelineStepName, type RunStep } from "@prepsync/core";
import { applyProcessEnv } from "../config";
import {
  WORKER_LIMITS,
  getLlmClient,
  markRunFailed,
  markRunRunning,
  saveKit,
  upsertStep,
} from "../pipeline/executeRun";
import type { Env, RunParams } from "../types";

const STEP_CONFIG = {
  retries: { limit: 0, delay: "1 second" },
  timeout: "10 minutes",
} as const;

export class RunPipelineWorkflow extends WorkflowEntrypoint<Env, RunParams> {
  async run(event: WorkflowEvent<RunParams>, step: WorkflowStep): Promise<void> {
    const { runId, userId, jd, companyUrl, companyName, days } = event.payload;
    const env = this.env;

    applyProcessEnv(env);

    const durable: RunStep = (name, fn) =>
      step.do(name, STEP_CONFIG, fn as never) as unknown as ReturnType<typeof fn>;

    const reportProgress = (
      stage: PipelineStepName,
      status: "running" | "done" | "failed",
      note?: string
    ) =>
      step.do(`progress-${stage}-${status}`, STEP_CONFIG, async () => {
        await upsertStep(env.DB, runId, stage, status, note);
        return null;
      }) as unknown as Promise<void>;

    try {
      await step.do("mark-running", STEP_CONFIG, async () => {
        await markRunRunning(env.DB, runId);
        return null;
      });

      const result = await runPipeline({
        jd,
        companyUrl,
        companyName,
        days,
        llmClient: getLlmClient(env),
        runStep: durable,
        onStep: reportProgress,
        limits: WORKER_LIMITS,
      });

      const { version: _version, ...kitData } = result.kit;
      await step.do("save-kit", STEP_CONFIG, async () => saveKit(env.DB, runId, userId, kitData));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await step.do("mark-failed", STEP_CONFIG, async () => {
        await markRunFailed(env.DB, runId, message);
        return null;
      });
    }
  }
}
