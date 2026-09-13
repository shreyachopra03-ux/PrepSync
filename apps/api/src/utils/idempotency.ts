import { createHash } from "crypto";

function normalise(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function computeIdempotencyKey(userId: string, jd: string, companyUrl: string): string {
  const normalisedJd = normalise(jd);
  const normalisedCompanyUrl = normalise(companyUrl);

  return createHash("sha256")
    .update(`${userId}:${normalisedJd}:${normalisedCompanyUrl}`)
    .digest("hex");
}
