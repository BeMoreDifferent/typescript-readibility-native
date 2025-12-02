"use strict";

// Public JS surface. Uses the generated napi loader at ../native/index.js.
const binding = require("../native/index.js");

function assertNonEmptyHtml(html) {
  if (typeof html !== "string") {
    throw new TypeError("html must be a string");
  }
  if (!html.trim()) {
    throw new Error("html must not be empty");
  }
}

function parseHtml(html, options = {}) {
  assertNonEmptyHtml(html);
  const { url } = options;
  if (url != null && typeof url !== "string") {
    throw new TypeError("url must be a string when provided");
  }

  // Native binding expects: (html: string, url?: string | null)
  return binding.parseHtml(html, url ?? null);
}

function parseMany(items) {
  if (!Array.isArray(items)) {
    throw new TypeError("parseMany expects an array of { html, url? }");
  }
  const normalized = items.map((item, idx) => {
    if (!item || typeof item !== "object") {
      throw new TypeError(`parseMany items[${idx}] must be an object`);
    }
    const { html, url } = item;
    assertNonEmptyHtml(html);
    if (url != null && typeof url !== "string") {
      throw new TypeError(`items[${idx}].url must be a string when provided`);
    }
    return [html, url ?? null];
  });

  const native = binding.parseMany || binding.parse_many;
  if (typeof native !== "function") {
    throw new Error("Native binding missing parseMany");
  }

  const results = native(normalized);
  return results.map((entry, idx) => {
    if (entry.error) {
      const err = new Error(entry.error);
      err.index = idx;
      throw err;
    }
    return entry.ok;
  });
}

function nativeVersion() {
  return binding.version();
}

module.exports = {
  parseHtml,
  parseMany,
  nativeVersion
};
