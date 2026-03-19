import { decode } from "npm:blurhash";

export function drawBlurhash(
  canvas: HTMLCanvasElement,
  hash: string,
  width: number,
  height: number,
  punch?: number,
): void {
  const w = Number.isFinite(width) && width >= 1 ? Math.round(width) : 1;
  const h = Number.isFinite(height) && height >= 1 ? Math.round(height) : 1;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const pixels = decode(hash, w, h, punch);

  const imageData = ctx.createImageData(w, h);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);
}
