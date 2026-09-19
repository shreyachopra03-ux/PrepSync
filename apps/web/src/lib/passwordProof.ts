const KDF_ITERATIONS = 300_000;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function derivePasswordProof(email: string, password: string): Promise<string> {
  const salt = new TextEncoder().encode(`prepsync:v1:${email.trim().toLowerCase()}`);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: KDF_ITERATIONS },
    key,
    256
  );
  return toBase64Url(new Uint8Array(bits));
}
