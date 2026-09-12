import dns from "dns/promises";
import { fetch } from "undici";

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 2 * 1024 * 1024; 
const ALLOWED_CONTENT_TYPES = ["text/html", "application/xhtml+xml"];

export interface FetchedPage {
  html: string;
  finalUrl: string;
}

function isPrivateIpv4(ip: string): boolean {
  return (
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("169.254.")
  );
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower.startsWith("fe80:") ||
    lower.startsWith("fc") ||
    lower.startsWith("fd")
  );
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

export interface FetchOptions {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  allowedContentTypes?: string[];
}

export async function fetchPage(
  url: string,
  options: FetchOptions = {}
): Promise<FetchedPage | null> {
  const allowedContentTypes = options.allowedContentTypes ?? ALLOWED_CONTENT_TYPES;

  try {
    const parsedUrl = new URL(url);

    const guardActive =
      process.env.NODE_ENV === "production" && process.env.ALLOW_PRIVATE_HOSTS !== "true";

    if (guardActive) {
      if (parsedUrl.hostname === "localhost" || (await isPrivateHost(parsedUrl.hostname))) {
        return null;
      }
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

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BYTES) {
      return null;
    }

    const html = await response.text();
    if (Buffer.byteLength(html, "utf8") > MAX_BYTES) {
      return null;
    }

    return { html, finalUrl: response.url };
  } catch {
    return null;
  }
}
