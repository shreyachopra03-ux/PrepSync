export interface ExtractedLink {
  url: string;
  anchorText: string;
  inNavOrFooter: boolean;
}

export interface RawAnchor {
  attrs: string;
  inner: string;
  index: number;
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

export function textFromHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

export function readAttribute(attrs: string, name: string): string | null {
  const pattern = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i");
  const match = pattern.exec(attrs);
  if (!match) return null;
  return decodeEntities(match[1] ?? match[2] ?? match[3] ?? "");
}

export function parseAnchors(html: string): RawAnchor[] {
  const anchors: RawAnchor[] = [];
  const pattern = /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    anchors.push({ attrs: match[1], inner: match[2], index: match.index });
  }
  return anchors;
}

function findNavFooterZones(html: string): [number, number][] {
  const zones: [number, number][] = [];
  const pattern = /<(\/?)(nav|footer)\b[^>]*>/gi;
  let depth = 0;
  let start = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    if (match[1] === "") {
      if (depth === 0) start = match.index;
      depth++;
    } else if (depth > 0) {
      depth--;
      if (depth === 0) zones.push([start, match.index]);
    }
  }
  if (depth > 0) zones.push([start, html.length]);

  return zones;
}

export function extractLinks(html: string, pageUrl: string): ExtractedLink[] {
  const zones = findNavFooterZones(html);
  const links: ExtractedLink[] = [];

  for (const anchor of parseAnchors(html)) {
    const href = readAttribute(anchor.attrs, "href");
    if (!href) continue;

    let resolved: URL;
    try {
      resolved = new URL(href, pageUrl);
    } catch {
      continue;
    }
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") continue;
    resolved.hash = "";

    links.push({
      url: resolved.toString(),
      anchorText: textFromHtml(anchor.inner),
      inNavOrFooter: zones.some(([start, end]) => anchor.index >= start && anchor.index <= end),
    });
  }

  return links;
}
