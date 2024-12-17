import { PhotoPosition } from "./types.ts";

export function calculateYAxis<El = HTMLElement>(
  position: PhotoPosition<El>,
  yAxisChange: number,
): number {
  const i = position.i;

  const isOnTop = i === position.len;

  if (isOnTop) {
    return 0;
  }

  const inv = position.len - i;

  if (position.pos === "B") {
    return inv * yAxisChange;
  }

  return inv * -yAxisChange;
}
