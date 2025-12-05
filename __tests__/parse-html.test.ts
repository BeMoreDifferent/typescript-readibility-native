import { describe, expect, test } from "vitest";

const { parseHtml, parseMany, nativeVersion } = require("../js/wrapper.js");

describe("parseHtml", () => {
  test("forwards html and url to the native binding", () => {
    const html = "<html><body><article><h1>Hello</h1><p>World</p></article></body></html>";
    const url = "https://example.com/post";

    const result = parseHtml(html, { url });

    expect(result).toBeTruthy();
    expect(typeof result).toBe("object");
    expect(result.textContent || result.content).toMatch(/Hello|World/i);
    if (result.title) {
      expect(result.title.length).toBeGreaterThan(0);
    }
  });

  test("supports high concurrency without altering shared state", async () => {
    const html = "<article><p>fast</p></article>";
    const tasks = Array.from({ length: 8 }, () =>
      Promise.resolve(parseHtml(html, { url: null }))
    );

    const results = await Promise.all(tasks);
    expect(results).toHaveLength(8);
    results.forEach((result) => {
      expect(result).toBeTruthy();
      expect(result.textContent || result.content).toMatch(/fast/i);
    });
  });

  test("handles deeply nested only-child wrappers without crashing", () => {
    const html =
      "<div><div><div><section><div><p>Nested keeps content</p></div></section></div></div></div>";
    const result = parseHtml(html, { url: "https://example.com/nested" });
    expect(result).toBeTruthy();
    const text = result.textContent || result.text_content || result.content;
    expect(text).toMatch(/Nested keeps content/i);
  });
});

describe("parseMany", () => {
  test("parses multiple documents in one call", () => {
    const docs = [
      { html: "<html><body><article><h1>A</h1></article></body></html>", url: "https://a.test" },
      { html: "<html><body><article><h1>B</h1></article></body></html>", url: "https://b.test" }
    ];
    const results = parseMany(docs);
    expect(results).toHaveLength(2);
    results.forEach((r) => {
      expect(typeof r).toBe("object");
    });
  });

  test("parses batches with nested wrappers", () => {
    const docs = [
      { html: "<div><div><div><p>Batch A</p></div></div></div>" },
      { html: "<section><section><section><p>Batch B</p></section></section></section>" }
    ];
    const [a, b] = parseMany(docs);
    expect((a.text_content || a.textContent || a.content) ?? "").toMatch(/Batch A/i);
    expect((b.text_content || b.textContent || b.content) ?? "").toMatch(/Batch B/i);
  });
});

describe("nativeVersion", () => {
  test("returns the native version string", () => {
    const ver = nativeVersion();
    expect(typeof ver).toBe("string");
    expect(ver.length).toBeGreaterThan(0);
  });
});
