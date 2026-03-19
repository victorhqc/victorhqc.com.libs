import { drawBlurhash } from "./decode.ts";

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
  init(root: ParentNode = document): void {
    const elements = root.querySelectorAll<HTMLElement>(this.opts.selector);
    elements.forEach((el) => this.render(el));
  }

  private render(el: HTMLElement): void {
    const hash = el.dataset.blurhash;
    if (!hash) return;

    const width = parseInt(el.dataset.blurhashWidth || "0", 10) || el.offsetWidth || this.opts.resolution;
    const height = parseInt(el.dataset.blurhashHeight || "0", 10) || el.offsetHeight || this.opts.resolution;

    // Keep the decode resolution small – the browser stretches it via CSS.
    const ratio = width / height;
    const decodeW = this.opts.resolution;
    const decodeH = Math.round(this.opts.resolution / ratio);

    const canvas = document.createElement("canvas");
    canvas.className = el.dataset.blurhashClass || "blurhash-canvas";
    drawBlurhash(canvas, hash, decodeW, decodeH);

    el.insertBefore(canvas, el.firstChild);
  }
}
