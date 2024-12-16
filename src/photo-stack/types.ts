/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

/**
 * Index = 0 means the photo is on the back.
 * Index = length - 1 means in on top.
 */
export interface PhotoPosition<El = HTMLElement> {
  index: number;
  last: number;
  prevIndex: number;
  // In this case, direction means direction of the stack. Which means the images will pile
  // depending on which position they are:
  // down: will place "below" in the screen, meaning the pictures below the one on top, will be placed below.
  // up: will place "on top" in the screen, meaning the pictures below the one on top, will be placed above.
  position: Position;
  element: El;
}

export type Direction = "UP" | "DOWN";

export type Position = "ON_TOP" | "ABOVE" | "BELOW";

export type IterableElements<El> = ArrayLike<El> | Iterable<El>;
// export type IterableElements = HTMLElement[] | NodeListOf<HTMLElement>;

export interface ScrambledData {
  photo: HTMLElement;
  x: number;
  y: number;
  z: number;
  degrees: number;
}

export interface ScrambledPosition {
  degrees: number;
  x: number;
}
