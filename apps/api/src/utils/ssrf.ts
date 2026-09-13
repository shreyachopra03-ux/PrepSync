import { env } from "../config/env";

const OBVIOUS_PRIVATE_HOSTNAMES = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];

export interface UrlValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateCompanyUrl(rawUrl: string): UrlValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: "company_url is not a valid URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, reason: "company_url must use http or https" };
  }

  const guardActive = env.NODE_ENV === "production" && !env.ALLOW_PRIVATE_HOSTS;

  if (guardActive && OBVIOUS_PRIVATE_HOSTNAMES.includes(parsed.hostname.toLowerCase())) {
    return { valid: false, reason: "company_url may not point to a private/local host" };
  }

  return { valid: true };
}
