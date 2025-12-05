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

## Scripts
- `npm test` – build + Vitest suite (uses real native binding)
- `npm run build` – compile the native addon (runs inside `native/`)

## Requirements
- Node.js 18+
- Rust toolchain (stable, with Cargo) to build the N-API addon
