import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { authRouter } from "./routes/auth.routes";
import { kitsRouter } from "./routes/kits.routes";
import { runsRouter } from "./routes/runs.routes";
import { practiceRouter } from "./routes/practice.routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.NODE_ENV === "production" ? undefined : true,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/auth", authRouter);
  app.use("/kits", kitsRouter);
  app.use("/runs", runsRouter);
  app.use("/practice", practiceRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
