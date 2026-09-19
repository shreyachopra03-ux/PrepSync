import type { MiddlewareHandler } from "hono";
import { getAuth } from "../auth";
import { HttpError } from "../errors";
import type { AppEnv } from "../types";

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const session = await getAuth(c.env).api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    throw new HttpError(401, "Not authenticated");
  }

  c.set("userId", session.user.id);
  await next();
};
