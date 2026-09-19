const PROOF_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isPasswordProof(value: unknown): value is string {
  return typeof value === "string" && PROOF_PATTERN.test(value);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function timingSafeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPasswordProof(proof: string): Promise<string> {
  const salt = toBase64(crypto.getRandomValues(new Uint8Array(16)));
  return `sha256$${salt}$${await sha256Hex(`${salt}:${proof}`)}`;
}

export async function verifyPasswordProof(proof: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "sha256" || !salt || !hash) return false;
  return timingSafeEqual(await sha256Hex(`${salt}:${proof}`), hash);
}

export function newId(): string {
  return crypto.randomUUID();
}
