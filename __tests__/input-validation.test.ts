import { describe, expect, test } from "vitest";

const { parseHtml, parseMany } = require("../js/wrapper.js");

describe("parseHtml input validation", () => {
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
});

describe("parseMany input validation", () => {
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

  test("rejects invalid url within batch", () => {
    expect(() =>
      parseMany([
        { html: "<p>ok</p>" },
        // @ts-expect-error intentional invalid type
        { html: "<p>bad</p>", url: 123 }
      ])
    ).toThrow(/url must be a string/);
  });
});
