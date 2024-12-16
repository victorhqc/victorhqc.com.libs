import { IterableElements, PhotoPosition, ScrambledData } from "./types.ts";

export function findOriginalOrThrow<El = HTMLElement>(
  scrambled: ScrambledData[],
  element: El,
) {
  const elements = scrambled.map(({ photo }) => photo);

  const index = findOrThrow(elements, (photo) => photo === element);
  return scrambled[index]!;
}

export function findFromPositionOrThrow<El = HTMLElement>(
  positions: PhotoPosition<El>[],
  element: El,
) {
  const elements = positions.map(({ element }) => element);
  const index = findOrThrow(elements, (el) => el === element);

  return positions[index]!;
}

export function findOrThrow<
  El = HTMLElement,
>(
  elements: IterableElements<El>,
  cb: (el: El) => boolean,
) {
  const arr = Array.isArray(elements) ? elements : Array.from(elements);
  const maybe = arr.findIndex(cb);

  if (maybe < 0) {
    throw new Error("Could not find element");
  }

  return maybe;
}
