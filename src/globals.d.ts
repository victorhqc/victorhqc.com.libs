import { PhotoStack } from "./photo-stack/class.ts";
declare global {
  interface Window {
    PhotoStack: typeof PhotoStack;
  }
}

export {};
