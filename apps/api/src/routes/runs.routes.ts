import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { HttpError } from "../middleware/errorHandler";
import { RunModel } from "../db/models/Run";

export const runsRouter = Router();

runsRouter.use(requireAuth);

runsRouter.get("/:id", async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const run = await RunModel.findOne({ _id: req.params.id, userId });

    if (!run) {
      throw new HttpError(404, "Run not found");
    }

    res.json({
      runId: run._id,
      kitId: run.kitId,
      status: run.status,
      steps: run.steps,
      error: run.error,
    });
  } catch (error) {
    next(error);
  }
});
