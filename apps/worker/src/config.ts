import type { Env } from "./types";

export function isProduction(env: Env): boolean {
  return env.NODE_ENV === "production";
}

export function allowedOrigin(env: Env): string | undefined {
  return env.FRONTEND_URL?.trim().replace(/\/+$/, "") || undefined;
}

export function assertConfigured(env: Env): void {
  const missing: string[] = [];
  if (!env.BETTER_AUTH_SECRET) missing.push("BETTER_AUTH_SECRET");
  if (!env.NVIDIA_API_KEY && !env.GROQ_API_KEY && !env.GEMINI_API_KEY) {
    missing.push("NVIDIA_API_KEY, GROQ_API_KEY or GEMINI_API_KEY (at least one)");
  }
  if (!allowedOrigin(env)) missing.push("FRONTEND_URL");

  if (missing.length > 0) {
    throw new Error(`Missing configuration: ${missing.join(", ")}`);
  }
}

export function applyProcessEnv(env: Env): void {
  process.env.ALLOW_PRIVATE_HOSTS = env.ALLOW_PRIVATE_HOSTS ?? "false";
  process.env.SSRF_DNS_CHECK = "off";
  if (env.TAVILY_API_KEY) {
    process.env.TAVILY_API_KEY = env.TAVILY_API_KEY;
  }
}
