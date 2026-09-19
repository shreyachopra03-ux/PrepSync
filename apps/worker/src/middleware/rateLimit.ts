import type { MiddlewareHandler } from "hono";
import { HttpError } from "../errors";
import type { AppEnv } from "../types";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

export const authRateLimiter: MiddlewareHandler<AppEnv> = async (c, next) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const now = Date.now();
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const key = `auth:${ip}:${windowStart}`;

  await c.env.DB.prepare("DELETE FROM rate_limits WHERE expires_at < ?").bind(now).run();

  const row = await c.env.DB.prepare(
    `INSERT INTO rate_limits (key, count, expires_at) VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET count = count + 1
     RETURNING count`
  )
    .bind(key, windowStart + WINDOW_MS)
    .first<{ count: number }>();

  if (row && row.count > MAX_ATTEMPTS) {
    throw new HttpError(429, "Too many attempts, please try again later");
  }

  await next();
};
