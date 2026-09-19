import { describe, it, expect } from "vitest";
import { extractLinks } from "../src/retrieval/htmlLinks";

const BASE = "https://acme.test/dir/page";

describe("extractLinks", () => {
  it("resolves relative urls and strips fragments", () => {
    const links = extractLinks(
      '<a href="/careers#open-roles">Careers</a><a href="team">Team</a>',
      BASE
    );
    expect(links.map((l) => l.url)).toEqual([
      "https://acme.test/careers",
      "https://acme.test/dir/team",
    ]);
  });

  it("skips non-http schemes and anchors without href", () => {
    const links = extractLinks(
      '<a href="mailto:a@b.c">m</a><a href="javascript:void(0)">j</a><a href="tel:123">t</a><a name="x">n</a><a href="/ok">ok</a>',
      BASE
    );
    expect(links.map((l) => l.url)).toEqual(["https://acme.test/ok"]);
  });

  it("flags links inside nav and footer, including nested tags", () => {
    const html = `
      <nav><ul><li><a href="/careers">Careers</a></li></ul></nav>
      <main><a href="/blog">Blog</a></main>
      <footer><div><a href="/about">About</a></div></footer>`;
    const byUrl = Object.fromEntries(extractLinks(html, BASE).map((l) => [l.url, l.inNavOrFooter]));
    expect(byUrl["https://acme.test/careers"]).toBe(true);
    expect(byUrl["https://acme.test/blog"]).toBe(false);
    expect(byUrl["https://acme.test/about"]).toBe(true);
  });

  it("extracts anchor text without inner tags and decodes entities", () => {
    const links = extractLinks(
      '<a class="x" href="/jobs"><span>Join</span>  <b>our</b> team &amp; more</a>',
      BASE
    );
    expect(links[0].anchorText).toBe("Join our team & more");
  });

  it("supports single quotes and does not confuse data-href with href", () => {
    const links = extractLinks(
      `<a data-href="/wrong" href='/right'>x</a><a data-href="/only-data">y</a>`,
      BASE
    );
    expect(links.map((l) => l.url)).toEqual(["https://acme.test/right"]);
  });

  it("returns an empty list for html without anchors", () => {
    expect(extractLinks("<p>nothing here</p>", BASE)).toEqual([]);
  });
});
