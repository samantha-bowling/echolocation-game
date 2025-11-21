/**
 * Data compression utilities for share URLs
 * Uses native browser CompressionStream API with fallback
 */

/**
 * Compress a string using gzip compression
 * @param data The string to compress
 * @returns Base64-encoded compressed data
 */
export async function compressData(data: string): Promise<string> {
  try {
    // Check if CompressionStream is supported (Chrome 80+, Firefox 113+)
    if (typeof CompressionStream !== 'undefined') {
      const blob = new Blob([data]);
      const stream = blob.stream();
      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
      const compressedBlob = await new Response(compressedStream).blob();
      const arrayBuffer = await compressedBlob.arrayBuffer();
      const uint8Array = Array.from(new Uint8Array(arrayBuffer));
      return btoa(String.fromCharCode(...uint8Array));
    }
    
    // Fallback: just use base64 encoding without compression
    console.warn('CompressionStream not supported, using base64 encoding only');
    return btoa(encodeURIComponent(data));
  } catch (error) {
    console.error('Compression failed:', error);
    // Ultimate fallback
    return btoa(encodeURIComponent(data));
  }
}

/**
 * Decompress a base64-encoded compressed string
 * @param compressed The base64-encoded compressed string
 * @returns Original decompressed string
 */
export async function decompressData(compressed: string): Promise<string> {
  try {
    // Check if DecompressionStream is supported
    if (typeof DecompressionStream !== 'undefined') {
      const binaryString = atob(compressed);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes]);
      const stream = blob.stream();
      const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
      const decompressedBlob = await new Response(decompressedStream).blob();
      return await decompressedBlob.text();
    }
    
    // Fallback: decode from base64
    console.warn('DecompressionStream not supported, using base64 decoding only');
    return decodeURIComponent(atob(compressed));
  } catch (error) {
    console.error('Decompression failed:', error);
    throw new Error('Failed to decompress data');
  }
}

/**
 * Estimate compressed size for UI display
 * @param data Original data string
 * @returns Estimated compressed size in bytes
 */
export function estimateCompressedSize(data: string): number {
  // Rough estimate: JSON typically compresses to 20-30% of original size
  const originalSize = new Blob([data]).size;
  return Math.floor(originalSize * 0.25);
}
