# typescript-readibility-native

Blazing-fast Readability for Node/TypeScript backed by Rust (`dom_smoothie` + `napi-rs`). Exposes a minimal API with both single and batched parsing to minimize overhead.

## Quick start
```bash
npm install typescript-readibility-native
npm run build   # compiles the native addon (uses npx napi in native/)
```

## Usage
```js
// CommonJS
const { parseHtml, parseMany, nativeVersion } = require("typescript-readibility-native");

// ESM
// import { parseHtml, parseMany, nativeVersion } from "typescript-readibility-native";

// Single document
const article = parseHtml(htmlString, { url: "https://example.com/page" });

// Batch documents (fewer JS↔Rust crossings)
const results = parseMany([
  { html: htmlA, url: "https://a.test" },
  { html: htmlB, url: "https://b.test" }
]);

console.log(nativeVersion()); // crate version string
```

## API

### `parseHtml(html, { url? }) => Article`
- `html` (**required**) string; must not be empty (throws `Error`).
- `url` (optional) string; base URL used to resolve relative links/images and improve metadata detection.
- Throws a `TypeError` when arguments are the wrong type.

### `parseMany([{ html, url? }, ...]) => Article[]`
- Accepts an array of objects with the same fields as `parseHtml`.
- Validates every entry; errors include the failing `index` property before bubbling the first failure.
- Useful for batching to reduce JS↔Rust overhead.

### `nativeVersion() => string`
- Returns the underlying Rust crate version (from `dom_smoothie`/`readibility_native`).

## Output shape (`Article`)
Fields are returned in snake_case from the native binding. Example TypeScript shape:

```ts
type Article = {
  title: string;
  byline: string | null;
  content: string;       // sanitized HTML of the readable portion
  text_content: string;  // plain text version of `content`
  length: number;        // text length
  excerpt: string | null;
  site_name: string | null;
  dir: string | null;            // text direction (e.g., "ltr")
  lang: string | null;           // document language if detected
  published_time: string | null; // ISO-ish timestamp when available
  modified_time: string | null;
  image: string | null;   // lead/og:image URL
  favicon: string | null; // shortcut icon if found
  url: string | null;     // canonical/metadata URL if available
};
```

## Scripts
- `npm test` – build + Vitest suite (uses real native binding)
- `npm run build` – compile the native addon (runs inside `native/`)

## Requirements
- Node.js 18+
- Rust toolchain (stable, with Cargo) to build the N-API addon
