import { Hono } from "hono";
import type { RunRow } from "../db";
import { HttpError } from "../errors";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types";

export const runsRoutes = new Hono<AppEnv>();

runsRoutes.use("*", requireAuth);

runsRoutes.get("/:id", async (c) => {
  const run = await c.env.DB.prepare("SELECT * FROM runs WHERE id = ? AND user_id = ?")
    .bind(c.req.param("id"), c.get("userId"))
    .first<RunRow>();

  if (!run) {
    throw new HttpError(404, "Run not found");
  }

  return c.json({
    runId: run.id,
    kitId: run.kit_id,
    status: run.status,
    steps: JSON.parse(run.steps),
    error: run.error,
  });
});
