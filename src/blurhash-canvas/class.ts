import { drawBlurhash } from "./decode.ts";
import { computeDecodeDimensions, resolveDimensions } from "./dimensions.ts";

interface BlurhashCanvasOptions {
  /** CSS selector for elements with a `data-blurhash` attribute. */
  selector?: string;
  /** Resolution to decode at (default 32). Kept small since it's a blurred placeholder. */
  resolution?: number;
}

const DEFAULTS: Required<BlurhashCanvasOptions> = {
  selector: "[data-blurhash]",
  resolution: 32,
};

export class BlurhashCanvas {
  private opts: Required<BlurhashCanvasOptions>;

  constructor(opts?: BlurhashCanvasOptions) {
    this.opts = { ...DEFAULTS, ...opts };
  }

  /** Scan the DOM (or a subtree) and render every blurhash placeholder found. */
  init(root: ParentNode | null | undefined = document): void {
    const effectiveRoot: ParentNode = root || document;
    const elements = effectiveRoot.querySelectorAll<HTMLElement>(this.opts.selector);
    elements.forEach((el) => this.render(el));
  }

  private render(el: HTMLElement): void {
    const hash = el.dataset.blurhash;
    if (!hash) return;

    const { width, height } = resolveDimensions(
      el.dataset.blurhashWidth,
      el.dataset.blurhashHeight,
      el.offsetWidth,
      el.offsetHeight,
      this.opts.resolution,
    );

    const { decodeW, decodeH } = computeDecodeDimensions(width, height, this.opts.resolution);

    // Skip if hash and dimensions are unchanged since the last render.
    const renderKey = `${hash}:${decodeW}x${decodeH}`;
    const existing = el.querySelector<HTMLCanvasElement>("canvas[data-blurhash-rendered]");
    if (existing && existing.getAttribute("data-blurhash-rendered") === renderKey) return;

    const isNew = !existing;
    const canvas = existing ?? document.createElement("canvas");
    if (isNew) {
      canvas.className = el.dataset.blurhashClass || "blurhash-canvas";
    }
    canvas.setAttribute("data-blurhash-rendered", renderKey);
    drawBlurhash(canvas, hash, decodeW, decodeH);

    if (!existing) {
      el.insertBefore(canvas, el.firstChild);
    }
  }
}
