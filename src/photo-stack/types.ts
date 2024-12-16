/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

/**
 * Index = 0 means the photo is on the back.
 * Index = length - 1 means in on top.
 */
export interface PhotoPosition<El = HTMLElement> {
  i: number;
  prevI: number;
  len: number;
  pos: Position;
  prevPos: Position;
  element: El;
}

export type Direction = "UP" | "DOWN";

// T = On Top
// A = Above
// B = Below
export type Position = "T" | "A" | "B";

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
