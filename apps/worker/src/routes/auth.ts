import { Hono } from "hono";
import { deleteCookie } from "hono/cookie";
import { hashPassword, isPasswordProof, newId, verifyPassword } from "../crypto";
import { nowIso } from "../db";
import { HttpError } from "../errors";
import { COOKIE_NAME, cookieOptions, issueSession, requireAuth } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rateLimit";
import type { AppEnv } from "../types";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
}

const PROOF_ERROR =
  "Credentials must be sent as a client-derived password proof (base64url PBKDF2 output)";

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/register", authRateLimiter, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { email, password } = body ?? {};

  if (typeof email !== "string" || !email.includes("@")) {
    throw new HttpError(400, "A valid email is required");
  }
  if (!isPasswordProof(password)) {
    throw new HttpError(400, PROOF_ERROR);
  }

  const normalisedEmail = email.trim().toLowerCase();
  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(normalisedEmail)
    .first();
  if (existing) {
    throw new HttpError(409, "An account with this email already exists");
  }

  const id = newId();
  const passwordHash = await hashPassword(password);

  try {
    await c.env.DB.prepare(
      "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)"
    )
      .bind(id, normalisedEmail, passwordHash, nowIso())
      .run();
  } catch {
    throw new HttpError(409, "An account with this email already exists");
  }

  await issueSession(c, id);
  return c.json({ user: { id, email: normalisedEmail } }, 201);
});

authRoutes.post("/login", authRateLimiter, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { email, password } = body ?? {};

  if (typeof email !== "string" || !isPasswordProof(password)) {
    throw new HttpError(400, PROOF_ERROR);
  }

  const user = await c.env.DB.prepare("SELECT id, email, password_hash FROM users WHERE email = ?")
    .bind(email.trim().toLowerCase())
    .first<UserRow>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new HttpError(401, "Invalid email or password");
  }

  await issueSession(c, user.id);
  return c.json({ user: { id: user.id, email: user.email } });
});

authRoutes.post("/logout", (c) => {
  deleteCookie(c, COOKIE_NAME, cookieOptions(c.env));
  return c.json({ ok: true });
});

authRoutes.get("/me", requireAuth, async (c) => {
  const user = await c.env.DB.prepare("SELECT id, email FROM users WHERE id = ?")
    .bind(c.get("userId"))
    .first<{ id: string; email: string }>();

  if (!user) {
    throw new HttpError(401, "Not authenticated");
  }
  return c.json({ user });
});
