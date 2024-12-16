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
  const isBelow = current.pos === "B";
  const isAbove = current.pos === "A";

  const c = { ...current, prevI: current.i, prevPos: current.pos };

  if (isOnTop(current.i, current.len)) {
    if (isMovingDown) {
      return { ...c, i: current.i - 1, pos: "B" };
    }

    return { ...c, i: current.i - 1, pos: "A" };
  }

  const onBottom = isOnBottom(current.i);

  if (onBottom && isBelow && isMovingDown) {
    return { ...c, i: current.len, pos: "T" };
  }

  if (onBottom && isAbove && isMovingUp) {
    return { ...c, i: current.len, pos: "T" };
  }

  if (isBelow) {
    if (isMovingUp) {
      const nextIndex = current.i + 1;

      if (current.len === nextIndex) {
        return { ...c, i: nextIndex, pos: "T" };
      }

      return { ...c, i: nextIndex };
    }

    if (isMovingDown) {
      return { ...c, i: current.i - 1 };
    }
  }

  if (isAbove) {
    if (isMovingUp) {
      return { ...c, i: current.i - 1 };
    }

    if (isMovingDown) {
      const nextIndex = current.i + 1;

      if (current.len === nextIndex) {
        return { ...c, i: nextIndex, pos: "T" };
      }

      return { ...c, i: nextIndex };
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
