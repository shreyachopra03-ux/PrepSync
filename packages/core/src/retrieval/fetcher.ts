import dns from "dns/promises";

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ["text/html", "application/xhtml+xml"];

export interface FetchedPage {
  html: string;
  finalUrl: string;
}

export interface FetchOptions {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  allowedContentTypes?: string[];
  maxBytes?: number;
  truncate?: boolean;
}

function parseIpv4(host: string): number[] | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const numbers = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : NaN));
  return numbers.every((n) => n >= 0 && n <= 255) ? numbers : null;
}

function isPrivateIpv4(ip: string): boolean {
  const octets = parseIpv4(ip);
  if (!octets) return false;
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower === "::" ||
    lower.startsWith("fe80:") ||
    lower.startsWith("fc") ||
    lower.startsWith("fd")
  );
}

function classifyIpLiteral(hostname: string): boolean | null {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (parseIpv4(host)) return isPrivateIpv4(host);
  if (host.includes(":")) return isPrivateIpv6(host);
  return null;
}

async function isPrivateHost(hostname: string): Promise<boolean> {
  try {
    const [v4, v6] = await Promise.allSettled([
      dns.resolve4(hostname),
      dns.resolve6(hostname),
    ]);

    const v4Addresses = v4.status === "fulfilled" ? v4.value : [];
    const v6Addresses = v6.status === "fulfilled" ? v6.value : [];

    if (v4Addresses.length === 0 && v6Addresses.length === 0) {
      return true;
    }

    return v4Addresses.some(isPrivateIpv4) || v6Addresses.some(isPrivateIpv6);
  } catch {
    return true;
  }
}

async function isBlockedHost(hostname: string): Promise<boolean> {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;

  const literal = classifyIpLiteral(host);
  if (literal !== null) return literal;

  if (process.env.SSRF_DNS_CHECK === "off") return false;
  return isPrivateHost(host);
}

async function readUpTo(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return (await response.text()).slice(0, maxBytes);

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => undefined);

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(merged.subarray(0, maxBytes));
}

export async function fetchPage(
  url: string,
  options: FetchOptions = {}
): Promise<FetchedPage | null> {
  const allowedContentTypes = options.allowedContentTypes ?? ALLOWED_CONTENT_TYPES;
  const maxBytes = options.maxBytes ?? MAX_BYTES;

  try {
    const parsedUrl = new URL(url);

    const guardActive =
      process.env.NODE_ENV === "production" && process.env.ALLOW_PRIVATE_HOSTS !== "true";

    if (guardActive && (await isBlockedHost(parsedUrl.hostname))) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response;
    try {
      response = await fetch(parsedUrl, {
        method: options.method ?? "GET",
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const isAllowedType = allowedContentTypes.some((type) => contentType.includes(type));
    if (!isAllowedType) {
      return null;
    }

    if (options.truncate) {
      return { html: await readUpTo(response, maxBytes), finalUrl: response.url };
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > maxBytes) {
      return null;
    }

    const html = await response.text();
    if (Buffer.byteLength(html, "utf8") > maxBytes) {
      return null;
    }

    return { html, finalUrl: response.url };
  } catch {
    return null;
  }
}
