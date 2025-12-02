import { describe, expect, test } from "vitest";

const { parseHtml, parseMany, nativeVersion } = require("../wrapper.js");

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

  test("rejects empty html input", () => {
    expect(() => parseHtml("   ")).toThrow(/must not be empty/);
  });

  test("rejects non-string html input", () => {
    // @ts-expect-error intentional invalid type
    expect(() => parseHtml(42)).toThrow(/must be a string/);
  });

  test("rejects invalid url option", () => {
    // @ts-expect-error intentional invalid type
    expect(() => parseHtml("<p>x</p>", { url: 123 })).toThrow(/url must be a string/);
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

  test("rejects invalid item shape", () => {
    // @ts-expect-error intentional invalid type
    expect(() => parseMany("nope")).toThrow(/expects an array/);
  });

  test("rejects empty html within batch", () => {
    expect(() =>
      parseMany([
        { html: "<p>ok</p>" },
        { html: "   " }
      ])
    ).toThrow(/must not be empty/);
  });
});

describe("nativeVersion", () => {
  test("returns the native version string", () => {
    const ver = nativeVersion();
    expect(typeof ver).toBe("string");
    expect(ver.length).toBeGreaterThan(0);
  });
});
