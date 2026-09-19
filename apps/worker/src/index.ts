import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { allowedOrigin, assertConfigured, isProduction } from "./config";
import { HttpError } from "./errors";
import { authRoutes } from "./routes/auth";
import { kitsRoutes } from "./routes/kits";
import { practiceRoutes } from "./routes/practice";
import { runsRoutes } from "./routes/runs";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.use("*", (c, next) => {
  const production = isProduction(c.env);
  const allowed = allowedOrigin(c.env);

  return cors({
    origin: (origin) => (production ? (origin === allowed ? origin : null) : origin),
    credentials: true,
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "If-Match"],
  })(c, next);
});

app.get("/health", (c) => c.json({ ok: true }));

app.use("*", async (c, next) => {
  assertConfigured(c.env);
  await next();
});

app.route("/auth", authRoutes);
app.route("/kits", kitsRoutes);
app.route("/runs", runsRoutes);
app.route("/practice", practiceRoutes);

app.notFound((c) => c.json({ error: `Not found: ${c.req.method} ${c.req.path}` }, 404));

app.onError((err, c) => {
  if (err instanceof HttpError) {
    return c.json({ error: err.message }, err.status as ContentfulStatusCode);
  }

  console.error(err);
  const message =
    isProduction(c.env) || !(err instanceof Error) ? "Internal server error" : err.message;
  return c.json({ error: message }, 500);
});

export default app;
export { RunPipelineWorkflow } from "./workflows/runPipelineWorkflow";
