import { Router } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../db/models/User";
import { signAuthToken, authCookieOptions, requireAuth, COOKIE_NAME } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rateLimit";
import { HttpError } from "../middleware/errorHandler";

const SALT_ROUNDS = 10;

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || !email.includes("@")) {
      throw new HttpError(400, "A valid email is required");
    }
    if (typeof password !== "string" || password.length < 8) {
      throw new HttpError(400, "Password must be at least 8 characters");
    }

    const normalisedEmail = email.trim().toLowerCase();
    const existing = await UserModel.findOne({ email: normalisedEmail });
    if (existing) {
      throw new HttpError(409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await UserModel.create({ email: normalisedEmail, passwordHash });

    const token = signAuthToken({ userId: user._id.toString() });
    res.cookie(COOKIE_NAME, token, authCookieOptions());

    res.status(201).json({ user: { id: user._id, email: user.email } });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      throw new HttpError(400, "Email and password are required");
    }

    const normalisedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalisedEmail });
    if (!user) {
      throw new HttpError(401, "Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new HttpError(401, "Invalid email or password");
    }

    const token = signAuthToken({ userId: user._id.toString() });
    res.cookie(COOKIE_NAME, token, authCookieOptions());

    res.status(200).json({ user: { id: user._id, email: user.email } });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.status(200).json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.auth!.userId);
    if (!user) {
      throw new HttpError(401, "Not authenticated");
    }
    res.json({ user: { id: user._id, email: user.email } });
  } catch (error) {
    next(error);
  }
});
