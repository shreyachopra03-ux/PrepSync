import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { isProduction } from "../config";
import { HttpError } from "../errors";
import type { AppEnv, Env } from "../types";

export const COOKIE_NAME = "token";
const SESSION_SECONDS = 7 * 24 * 60 * 60;

export function cookieOptions(env: Env) {
  const production = isProduction(env);
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? ("None" as const) : ("Lax" as const),
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}

export async function issueSession(c: Context<AppEnv>, userId: string): Promise<void> {
  const token = await sign(
    { userId, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS },
    c.env.JWT_SECRET,
    "HS256"
  );
  setCookie(c, COOKIE_NAME, token, cookieOptions(c.env));
}

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) {
    throw new HttpError(401, "Not authenticated");
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET, "HS256");
    c.set("userId", String(payload.userId));
  } catch {
    throw new HttpError(401, "Invalid or expired session");
  }

  await next();
};
