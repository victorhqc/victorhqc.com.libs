import { PhotoStack } from "./photo-stack/class.ts";
import { BlurhashCanvas } from "./blurhash-canvas/class.ts";

declare global {
  interface Window {
    PhotoStack: typeof PhotoStack;
    BlurhashCanvas: typeof BlurhashCanvas;
  }
}

export {};
