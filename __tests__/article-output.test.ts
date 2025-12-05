import { describe, expect, test } from "vitest";

const { parseHtml } = require("../js/wrapper.js");

const richHtml = `
<!doctype html>
<html lang="en">
  <head>
    <title>Primary Title</title>
    <meta name="author" content="Jane Doe" />
    <meta property="og:title" content="Readable Title" />
    <meta property="og:site_name" content="Example Site" />
    <meta property="og:image" content="https://example.com/og.jpg" />
    <meta property="article:published_time" content="2023-01-02T03:04:05Z" />
    <meta property="article:modified_time" content="2023-01-03T04:05:06Z" />
    <link rel="canonical" href="https://example.com/canonical-article" />
    <link rel="icon" href="https://example.com/favicon.ico" />
  </head>
  <body>
    <article>
      <header><h1>Readable Title</h1></header>
      <p>The quick brown fox jumps over the lazy dog.</p>
      <p>Another sentence to bump length for scoring purposes.</p>
    </article>
  </body>
</html>
`;

describe("Article output fields", () => {
  test("exposes all documented fields with expected shapes", () => {
    const article = parseHtml(richHtml, { url: "https://example.com/page?ref=1" });

    expect(article.title).toMatch(/Readable Title|Primary Title/);
    expect(article.byline === null || typeof article.byline === "string").toBe(true);
    expect(typeof article.content).toBe("string");
    expect(typeof article.text_content).toBe("string");
    expect(article.content.length).toBeGreaterThan(0);
    expect(article.text_content.length).toBeGreaterThan(0);
    expect(article.length).toBeGreaterThan(0);

    expect(article.excerpt === null || typeof article.excerpt === "string").toBe(true);
    expect(article.site_name === null || typeof article.site_name === "string").toBe(true);
    expect(article.dir === null || typeof article.dir === "string").toBe(true);
    expect(article.lang === null || typeof article.lang === "string").toBe(true);
    expect(article.published_time === null || typeof article.published_time === "string").toBe(
      true
    );
    expect(article.modified_time === null || typeof article.modified_time === "string").toBe(true);
    expect(article.image === null || typeof article.image === "string").toBe(true);
    expect(article.favicon === null || typeof article.favicon === "string").toBe(true);
    expect(article.url === null || typeof article.url === "string").toBe(true);
  });
});
