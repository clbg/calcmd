// URL compression utilities - based on TypeScript Playground approach
import LZString from 'lz-string';

/**
 * Compress markdown content for URL sharing
 * Uses LZ-String like TypeScript Playground
 */
export function compressToUrl(markdown: string): string {
  return LZString.compressToEncodedURIComponent(markdown);
}

/**
 * Decompress markdown content from URL
 * Handles both compressed and legacy uncompressed formats
 */
export function decompressFromUrl(compressed: string): string | null {
  // Try LZ-String decompression first
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    if (decompressed) return decompressed;
  } catch (e) {
    // Fall through to legacy format
  }

  // Fall back to plain decodeURIComponent for backward compatibility
  try {
    return decodeURIComponent(compressed);
  } catch (e) {
    return null;
  }
}

/**
 * Get markdown from URL search params
 */
export function getMarkdownFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const compressed = params.get('code');
  if (!compressed) return null;
  return decompressFromUrl(compressed);
}

/**
 * Update URL with compressed markdown
 */
export function updateUrl(markdown: string): void {
  const compressed = compressToUrl(markdown);
  const params = new URLSearchParams();
  params.set('code', compressed);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', newUrl);
}
