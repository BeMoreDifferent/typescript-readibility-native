export interface ParseOptions {
  /**
   * Optional canonical/base URL for the HTML. Helps resolve relative links.
   */
  url?: string | null;
}

export interface ReadabilityResult {
  title: string | null;
  content: string | null;
  textContent: string | null;
  length: number | null;
  excerpt: string | null;
  byline: string | null;
  siteName?: string | null;
  lang?: string | null;
  publishedTime?: string | null;
  [key: string]: unknown;
}

/**
 * Parse raw HTML into a structured Readability article using the Rust engine.
 */
export function parseHtml(html: string, options?: ParseOptions): ReadabilityResult;

/**
 * Batch parse multiple HTML documents in one native call to reduce overhead.
 * Throws if any item has an error; error.index indicates the failing item.
 */
export function parseMany(
  items: Array<{ html: string; url?: string | null }>
): ReadabilityResult[];

/**
 * Native crate version for diagnostics.
 */
export function nativeVersion(): string;
