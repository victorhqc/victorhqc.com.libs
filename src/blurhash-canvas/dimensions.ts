/**
 * Resolve the logical dimensions of an element from data attributes and fallbacks.
 *
 * Fallback chain: data-blurhash-width/height → offsetWidth/Height → resolution default.
 */
export function resolveDimensions(
  dataWidth: string | undefined,
  dataHeight: string | undefined,
  offsetWidth: number,
  offsetHeight: number,
  resolution: number,
): { width: number; height: number } {
  const width = parseInt(dataWidth || "0", 10) || offsetWidth || resolution;
  const height = parseInt(dataHeight || "0", 10) || offsetHeight || resolution;
  return { width, height };
}

/**
 * Compute the small decode dimensions that preserve the aspect ratio.
 *
 * The decoded image is intentionally tiny (resolution × resolution/ratio)
 * because the browser stretches it via CSS.
 */
export function computeDecodeDimensions(
  width: number,
  height: number,
  resolution: number,
): { decodeW: number; decodeH: number } {
  const res = Math.max(1, resolution);
  const ratio = width / height;
  return {
    decodeW: res,
    decodeH: Math.max(1, Math.round(res / ratio)),
  };
}
