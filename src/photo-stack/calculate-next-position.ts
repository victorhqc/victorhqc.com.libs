import { Direction, PhotoPosition } from "./types.ts";
import { findFromPositionOrThrow } from "./find-elements.ts";

export function calculateNextPosition<El = HTMLElement>(
  positions: PhotoPosition<El>[],
  element: El,
  direction: Direction,
): PhotoPosition<El> {
  const isMovingDown = direction === "DOWN";
  const isMovingUp = direction === "UP";

  const current = findFromPositionOrThrow<El>(positions, element);
  const isBelow = current.position === "BELOW";
  const isAbove = current.position === "ABOVE";

  const c = { ...current, prevIndex: current.index };

  if (isOnTop(current.index, current.last)) {
    if (isMovingDown) {
      return { ...c, index: current.index - 1, position: "BELOW" };
    }

    return { ...c, index: current.index - 1, position: "ABOVE" };
  }

  const onBottom = isOnBottom(current.index);

  if (onBottom && isBelow && isMovingDown) {
    return { ...c, index: current.last, position: "ON_TOP" };
  }

  if (onBottom && isAbove && isMovingUp) {
    return { ...c, index: current.last, position: "ON_TOP" };
  }

  if (isBelow) {
    if (isMovingUp) {
      const nextIndex = current.index + 1;
      return {
        ...c,
        index: nextIndex,
        position: nextIndex === current.last ? "ON_TOP" : "BELOW",
      };
    }

    if (isMovingDown) {
      return { ...c, index: current.index - 1 };
    }
  }

  if (isAbove) {
    if (isMovingUp) {
      return { ...c, index: current.index - 1 };
    }

    if (isMovingDown) {
      const nextIndex = current.index + 1;

      if (current.last === nextIndex) {
        return { ...c, index: nextIndex, position: "ON_TOP" };
      }

      if (current.prevIndex === current.last) {
        return { ...c, index: nextIndex, position: "BELOW" };
      }

      return { ...c, index: nextIndex };
    }
  }

  throw new Error("Could not calculate next position");
}

function isOnTop(index: number, last: number) {
  return index === last;
}

function isOnBottom(index: number) {
  return index === 0;
}
