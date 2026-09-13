import { describe, it, expect } from "vitest";
import { rankLinksInPage } from "../src/retrieval/linkRanker";

const FIXTURE_HTML = `
<html>
  <body>
    <header>
      <nav>
        <a href="/careers">Careers</a>
        <a href="/products">Products</a>
      </nav>
    </header>
    <main>
      <p>Welcome to Acme. Check our <a href="/blog/random-post">latest blog post</a>.</p>
      <a href="/legal/privacy-policy">Privacy Policy</a>
    </main>
    <footer>
      <a href="/about">About Us</a>
    </footer>
  </body>
</html>
`;

describe("rankLinksInPage", () => {
  it("ranks the careers link above unrelated links", () => {
    const ranked = rankLinksInPage(FIXTURE_HTML, "https://acme.com/");
    const sorted = [...ranked].sort((a, b) => b.score - a.score);

    expect(sorted[0].url).toBe("https://acme.com/careers");
  });

  it("gives a nav-menu link a higher score than a similar link outside nav/footer", () => {
    const ranked = rankLinksInPage(FIXTURE_HTML, "https://acme.com/");
    const careersLink = ranked.find((l) => l.url === "https://acme.com/careers");
    const privacyLink = ranked.find((l) => l.url === "https://acme.com/legal/privacy-policy");

    expect(careersLink).toBeDefined();
    expect(privacyLink).toBeDefined();
    expect(careersLink!.score).toBeGreaterThan(privacyLink!.score);
  });

  it("resolves relative hrefs to absolute urls using the page url", () => {
    const ranked = rankLinksInPage(FIXTURE_HTML, "https://acme.com/");
    expect(ranked.every((l) => l.url.startsWith("https://acme.com/"))).toBe(true);
  });
});
