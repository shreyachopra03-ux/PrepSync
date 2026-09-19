import { env as globalEnv } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { allowedOrigin, isProduction } from "./config";
import { hashPasswordProof, isPasswordProof, verifyPasswordProof } from "./crypto";
import type { Env } from "./types";

export const PROOF_ERROR =
  "Credentials must be sent as a client-derived password proof (base64url PBKDF2 output)";

const AUTH_WINDOW_SECONDS = 15 * 60;
const AUTH_MAX_ATTEMPTS = 20;

function createAuth(env: Env) {
  const origin = allowedOrigin(env) as string;

  return betterAuth({
    baseURL: origin,
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    trustedOrigins: [origin],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
      password: {
        hash: async (password) => {
          if (!isPasswordProof(password)) {
            throw new APIError("BAD_REQUEST", { message: PROOF_ERROR });
          }
          return hashPasswordProof(password);
        },
        verify: async ({ hash, password }) => verifyPasswordProof(password, hash),
      },
    },
    advanced: {
      useSecureCookies: isProduction(env),
      ipAddress: { ipAddressHeaders: ["x-forwarded-for", "cf-connecting-ip"] },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: AUTH_WINDOW_SECONDS, max: AUTH_MAX_ATTEMPTS },
        "/sign-up/email": { window: AUTH_WINDOW_SECONDS, max: AUTH_MAX_ATTEMPTS },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

let instance: Auth | null = null;

try {
  instance = createAuth(globalEnv as unknown as Env);
} catch {
  instance = null;
}

export function getAuth(env: Env): Auth {
  if (!instance) {
    instance = createAuth(env);
  }
  return instance;
}
