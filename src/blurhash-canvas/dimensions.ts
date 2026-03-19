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
  const parsed = (v: string | undefined) => {
    const n = parseInt(v || "0", 10);
    return n > 0 ? n : 0;
  };
  const pos = (...vals: number[]) => vals.find((v) => v > 0) ?? 1;

  const width = pos(parsed(dataWidth), offsetWidth, resolution);
  const height = pos(parsed(dataHeight), offsetHeight, resolution);
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
  const w = Number.isFinite(width) && width > 0 ? width : 1;
  const h = Number.isFinite(height) && height > 0 ? height : 1;
  const ratio = w / h;

  let decodeW: number;
  let decodeH: number;

  if (ratio >= 1) {
    // Landscape or square: fix width to resolution, scale height down.
    decodeW = res;
    decodeH = Math.max(1, Math.round(res / ratio));
  } else {
    // Portrait: fix height to resolution, scale width down.
    decodeH = res;
    decodeW = Math.max(1, Math.round(res * ratio));
  }

  return { decodeW, decodeH };
}
