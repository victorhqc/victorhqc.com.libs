/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { waitForAllToLoad } from "./wait-for-all-to-load.ts";
import { calculateNextPosition } from "./calculate-next-position.ts";
import { calculateYAxis } from "./calculate-y-axis.ts";
import {
  PhotoPosition,
  Position,
  ScrambledData,
  ScrambledPosition,
} from "./types.ts";
import {
  findFromPositionOrThrow,
  findOriginalOrThrow,
} from "./find-elements.ts";

const REGEX_TRANSFORM =
  /(translate3d\(([-+]?[0-9]+px,?\s?){3}\))\s?(rotate\([-+]?[0-9]+deg\))/gi;
const REGEX_TRANSLATE3D =
  /translate3d\(((-?[0-9]+)px,?\s?)(((\+|-)?[0-9]+)px,?\s?)(((\+|-)?[0-9]+)px,?\s?)\)/gi;
const Z_AXIS_CHANGE = 10;
const Y_AXIS_CHANGE = 20;

export class PhotoStack {
  private photos: NodeListOf<HTMLElement>;
  private stackSelector: string;
  private slideSelector: string;
  private zAxisChange: number;
  private yAxisChange: number;
  private positions: PhotoPosition[];

  constructor({
    stackSelector = "#photos-stack",
    slideSelector = ".photo-slide",
    zAxisChange = Z_AXIS_CHANGE,
    yAxisChange = Y_AXIS_CHANGE,
  }: {
    stackSelector: string;
    slideSelector: string;
    zAxisChange: number;
    yAxisChange: number;
  }) {
    this.stackSelector = stackSelector;
    this.slideSelector = slideSelector;
    this.zAxisChange = zAxisChange;
    this.yAxisChange = yAxisChange;

    const container = document.querySelector<HTMLElement>(this.stackSelector);
    if (!container) {
      throw new Error("Could not find container");
    }

    container.classList.add("photos-stack");

    this.photos = document.querySelectorAll<HTMLElement>(this.slideSelector);
    const len = this.photos.length - 1;
    this.positions = Array.from(this.photos).map<PhotoPosition>(
      (el, index) => {
        const pos: Position = index === len ? "T" : "B";
        const prevPos: Position = index === 0 ? "T" : "B";
        const prevI = index === len ? 0 : index + 1;

        return { i: index, prevI, len, element: el, pos, prevPos };
      },
    );
  }

  async init() {
    await waitForAllToLoad(this.photos);

    const scrambledPhotos = this.calculateScramblePositions(
      this.photos,
      this.positions,
    );

    for (const { photo, x, y, z, degrees } of scrambledPhotos) {
      photo.style.transform = `translate3d(0px, 0px, 0px) rotate(0deg)`;
      setTimeout(() => {
        photo.style.transform =
          `translate3d(${x}px, ${y}px, ${z}px) rotate(${degrees}deg)`;
      }, 50);
    }

    const stack: HTMLElement | null = document.querySelector(
      this.stackSelector,
    );
    if (stack) {
      this.addWheelEvent(stack, this.slideSelector, scrambledPhotos);
    }
  }

  private addWheelEvent(
    wrapper: HTMLElement,
    photosSelector: string,
    scrambled: ScrambledData[],
  ) {
    let isThrottled = false;
    wrapper.addEventListener("wheel", (event) => {
      event.preventDefault();

      if (isThrottled) return;
      const photos: NodeListOf<HTMLElement> = document.querySelectorAll(
        photosSelector,
      );
      const direction = event.deltaY > 0 ? "UP" : "DOWN";

      let sortedPhotos;
      /*
      When an animation starts, the `beforeRenderCb`, the position of the element that will be placed on top of
      the stack, needs to be resetted or the animation will look janky and out of place. This callback ensures
      that the position is in the appropriate place BEFORE the element is rendered back in the DOM.
      */
      switch (direction) {
        case "UP":
          sortedPhotos = this.sortPhotos(
            photos,
            (element) => {
              const newPosition = calculateNextPosition(
                this.positions,
                element,
                "UP",
              );
              this.positions = updatePositions(this.positions, newPosition);

              return newPosition.i;
            },
            (element) => {
              const position = findFromPositionOrThrow(this.positions, element);
              const { x, degrees } = findOriginalOrThrow(scrambled, element);

              const y = this.yAxisChange * position.prevI;
              const z = this.zAxisChange * position.prevI;

              element.style.transform =
                `translate3d(${x}px, ${y}px, -${z}px) rotate(${degrees}deg)`;
              element.style.zIndex = `${position.prevI}`;
              element.style.transitionDuration = "150ms";
            },
          );
          break;
        case "DOWN":
          sortedPhotos = this.sortPhotos(
            photos,
            (element) => {
              const newPosition = calculateNextPosition(
                this.positions,
                element,
                "DOWN",
              );
              this.positions = updatePositions(this.positions, newPosition);

              return newPosition.i;
            },
            (element) => {
              const position = findFromPositionOrThrow(this.positions, element);
              const { x, degrees } = findOriginalOrThrow(scrambled, element);

              const y = this.yAxisChange * position.len;
              const z = this.zAxisChange * position.len;

              element.style.transform =
                `translate3d(${x}px, -${y}px, -${z}px) rotate(${degrees}deg)`;
              element.style.zIndex = `${position.prevI}`;
              element.style.transitionDuration = "150ms";
            },
          );
          break;
      }

      console.log("POSITIONS", this.positions);

      setTimeout(() => {
        this.animateOnMovement(sortedPhotos, scrambled);
      }, 50);

      isThrottled = true;
      setTimeout(() => (isThrottled = false), 800);
    });
  }

  private animateOnMovement(
    elements: HTMLElement[],
    scrambled: ScrambledData[],
  ) {
    elements.forEach((element) => {
      const position = findFromPositionOrThrow(this.positions, element);

      const newZ = this.calculateZAxis(position);
      const newY = this.calculateYAxis(position);
      const { x, degrees } = findOriginalOrThrow(scrambled, element);

      if (position.pos === "T") {
        setTimeout(() => {
          setTimeout(() => {
            element.style.zIndex = `${position.i}`;
          }, 1);

          element.style.transform =
            `translate3d(${x}px, 0px, 0px) rotate(${degrees}deg)`;
          element.style.transformOrigin = "";
        }, 50);
      } else {
        element.style.transitionDuration = "300ms";
        element.style.transform =
          `translate3d(${x}px, ${newY}px, ${newZ}px) rotate(${degrees}deg)`;
        element.style.zIndex = `${position.i}`;
      }

      setTimeout(() => (element.style.transitionDuration = "0ms"), 300);
    });
  }

  private sortPhotos(
    elms: NodeListOf<HTMLElement>,
    sortCb: (element: HTMLElement) => number,
    beforeRenderCb: (element: HTMLElement) => void,
  ): HTMLElement[] {
    if (elms.length === 0) return Array.from(elms);

    const firstElement = elms[0];
    if (!firstElement) throw new Error("Could not find first element");

    const parent = firstElement.parentNode;
    if (!parent) return Array.from(elms);

    const elements = Array.from(elms)
      .map((element) => {
        const newIndex = sortCb(element);

        return { element, newIndex };
      })
      .sort((a, b) => a.newIndex - b.newIndex)
      .map(({ element }) => element);

    elements.forEach((element) => {
      element.remove();
      beforeRenderCb(element);

      parent.appendChild(element);
    });

    return elements;
  }

  private calculateZAxis(position: PhotoPosition) {
    const { z } = getTransform(position.element);
    const isOnTop = position.i === position.len;

    if (isOnTop) {
      return 0;
    }

    const inv = position.len - position.i;

    if (position.prevPos === "T") {
      return -this.zAxisChange * inv;
    }

    return z - this.zAxisChange;
  }

  private calculateYAxis(position: PhotoPosition): number {
    return calculateYAxis(position, this.yAxisChange);
  }

  private calculateScramblePositions(
    elements: NodeListOf<HTMLElement>,
    positions: PhotoPosition[],
  ): ScrambledData[] {
    const len = elements.length - 1;

    const scrambled: ScrambledData[] = [];
    for (const [i, photo] of elements.entries()) {
      const position = findFromPositionOrThrow(positions, photo);

      const y = this.calculateYAxis(position);
      const z = this.calculateZAxis(position);
      const { degrees, x } = this.calculateScramblePosition(i, len);
      scrambled.push({ photo, x, y, z, degrees });
    }

    return scrambled;
  }

  private calculateScramblePosition(
    index: number,
    last: number,
  ): ScrambledPosition {
    return { x: 0, degrees: 0 };

    // if (index === last) {
    //   return { x: 0, degrees: 0 };
    // }

    // const degrees = calculateDegrees(index);

    // const minX = randomPositiveNegative(20);
    // const maxX = randomPositiveNegative(40);
    // const x = randomIntFromInterval(minX, maxX);

    // return { degrees, x };
  }
}

function calculateDegrees(index: number): number {
  const minDeg = index * 4 + 1;
  const maxDeg = index * 5 + 5;
  return randomIntFromInterval(minDeg, maxDeg);
}

function getTransform(element: HTMLElement): TransformData {
  const originalTransform = element.style.transform;

  const matches = [...originalTransform.matchAll(REGEX_TRANSFORM)];
  if (matches.length === 0) {
    return { x: 0, y: 0, z: 0, rotate: `rotate(0deg)` };
  }

  if (!matches[0]) {
    throw new Error("Could not find transform");
  }

  const translate = matches[0][1];
  const rotate = matches[0][3] ?? `rotate(0deg)`;

  if (!translate) {
    throw new Error("Could not find translate");
  }

  const translateMatches = [...translate.matchAll(REGEX_TRANSLATE3D)];
  const match = translateMatches[0];
  if (!match) {
    throw new Error("Invalid Transform");
  }

  const rawX = match[2];
  const rawY = match[4];
  const rawZ = match[7];

  if (!rawX || !rawY || !rawZ) {
    throw new Error("Invalid Transform");
  }

  const x = parseInt(rawX);
  const y = parseInt(rawY);
  const z = parseInt(rawZ);

  return { x, y, z, rotate };
}

function randomIntFromInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomPositiveNegative(number: number): number {
  const sign = Math.random() < 0.5 ? -1 : 1;
  return number * sign;
}

function updatePositions(
  positions: PhotoPosition[],
  newPosition: PhotoPosition,
) {
  const index = positions.findIndex(({ element }) =>
    element === newPosition.element
  );
  if (index < 0) {
    throw new Error("Could not find position");
  }

  return [
    ...positions.slice(0, index),
    newPosition,
    ...positions.slice(index + 1),
  ];
}

interface TransformData {
  x: number;
  y: number;
  z: number;
  rotate: string;
}
