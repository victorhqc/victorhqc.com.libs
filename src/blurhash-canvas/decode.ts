import { decode } from "npm:blurhash";

export function drawBlurhash(
  canvas: HTMLCanvasElement,
  hash: string,
  width: number,
  height: number,
  punch?: number,
): void {
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const pixels = decode(hash, width, height, punch);

  const imageData = ctx.createImageData(width, height);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);
}
