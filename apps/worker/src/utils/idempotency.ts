import { sha256Hex } from "../crypto";

function normalise(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function computeIdempotencyKey(
  userId: string,
  jd: string,
  companyUrl: string
): Promise<string> {
  return sha256Hex(`${userId}:${normalise(jd)}:${normalise(companyUrl)}`);
}
