/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { waitForAllToLoad } from "./wait-for-all-to-load.ts";
import { calculateNextPosition } from "./calculate-next-position.ts";
import { calculateYAxis } from "./calculate-y-axis.ts";
import {
  Direction,
  PhotoPosition,
  Position,
  ScrambledData,
  ScrambledPosition,
} from "./types.ts";
import {
  findFromPositionOrThrow,
  findOriginalOrThrow,
} from "./find-elements.ts";

const Z_AXIS_CHANGE = 10;
const Y_AXIS_CHANGE = 20;

export class PhotoStack {
  private photos: NodeListOf<HTMLElement>;
  private stackSelector: string;
  private slideSelector: string;
  private zAxisChange: number;
  private yAxisChange: number;
  private positions: { current: PhotoPosition; prev: PhotoPosition }[];

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
    this.positions = Array.from(this.photos).map<
      { current: PhotoPosition; prev: PhotoPosition }
    >(
      (element, index) => {
        const pos: Position = index === len ? "T" : "B";
        const prevPos: Position = index === 0 ? "T" : "B";
        const prevI = index === len ? 0 : index + 1;

        return {
          current: { i: index, len, pos, element },
          prev: { i: prevI, len, pos: prevPos, element },
        };
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
      const direction: Direction = event.deltaY > 0 ? "UP" : "DOWN";

      this.animateOnMovement(
        photos,
        direction,
        ({ element, current, prev }, shouldReset) => {
          const z = this.calculateZAxis(current);
          const y = this.calculateYAxis(current);
          const { x, degrees } = findOriginalOrThrow(scrambled, element);

          if (!shouldReset) {
            this.animate(element, current.i, x, y, z, degrees);

            return;
          }

          if (current.pos === "T") {
            const resetI = current.len - 1;

            const resetYPosition: PhotoPosition = {
              i: resetI,
              pos: prev.pos === "B" ? "A" : "B", // Flip the position
              len: current.len,
              element: current.element,
            };

            const resetZPosition: PhotoPosition = {
              i: 0,
              pos: prev.pos === "B" ? "A" : "B", // Flip the position
              len: current.len,
              element: current.element,
            };

            const resetY = this.calculateYAxis(resetYPosition);
            const resetZ = this.calculateZAxis(resetZPosition);

            element.style.transitionDuration = "0ms";
            element.style.transform =
              `translate3d(${x}px, ${resetY}px, ${resetZ}px) rotate(${degrees}deg)`;
            element.style.zIndex = `${0}`;

            setTimeout(
              () => this.animate(element, current.i, x, y, z, degrees),
              10,
            );
          } else {
            setTimeout(
              () => this.animate(element, current.i, x, y, z, degrees),
              10,
            );
          }
        },
      );

      isThrottled = true;
      setTimeout(() => (isThrottled = false), 600);
    });
  }

  private animateOnMovement(
    elms: NodeListOf<HTMLElement>,
    direction: Direction,
    applyStylesCb: (
      data: {
        element: HTMLElement;
        current: PhotoPosition;
        prev: PhotoPosition;
      },
      shouldReset: boolean,
    ) => void,
  ) {
    if (elms.length === 0) return Array.from(elms);

    const currentPositions = this.positions.map(({ current }) => current);

    const elements = Array.from(elms);
    const positions = elements.map<
      { element: HTMLElement; current: PhotoPosition; prev: PhotoPosition }
    >((element) => {
      const prev = findFromPositionOrThrow(
        currentPositions,
        element,
      );
      const current = calculateNextPosition(
        currentPositions,
        element,
        direction,
      );

      return { current, prev, element };
    });

    // Reset the animation when the photo that will be on top, is coming from the very bottom of the pile.
    const shouldReset = positions.some(({ current, prev }) =>
      current.pos === "T" && prev.i === 0
    );

    // Top should always move first.
    const sorted = positions.sort((a, b) => b.current.i - a.current.i);

    sorted.forEach((d) => applyStylesCb(d, shouldReset));

    this.positions = positions.map(({ current, prev }) => ({ current, prev }));
  }

  private animate(
    element: HTMLElement,
    i: number,
    x: number,
    y: number,
    z: number,
    degrees: number,
    ms = 300,
  ) {
    element.style.transitionDuration = `${ms}ms`;
    element.style.transform =
      `translate3d(${x}px, ${y}px, ${z}px) rotate(${degrees}deg)`;
    element.style.zIndex = `${i}`;

    setTimeout(() => (element.style.transitionDuration = "0ms"), ms);
  }

  private calculateZAxis(position: PhotoPosition): number {
    const i = position.i;

    const isOnTop = i === position.len;

    if (isOnTop) {
      return 0;
    }

    const inv = position.len - i;
    return inv * -this.zAxisChange;
  }

  private calculateYAxis(position: PhotoPosition): number {
    return calculateYAxis(position, this.yAxisChange);
  }

  private calculateScramblePositions(
    elements: NodeListOf<HTMLElement>,
    positions: { current: PhotoPosition; prev: PhotoPosition }[],
  ): ScrambledData[] {
    const len = elements.length - 1;

    const currentPositions = positions.map(({ current }) => current);

    const scrambled: ScrambledData[] = [];
    for (const [i, photo] of elements.entries()) {
      const position = findFromPositionOrThrow(currentPositions, photo);

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
    if (index === last) {
      return { x: 0, degrees: 0 };
    }

    const degrees = calculateDegrees(index);

    const minX = randomPositiveNegative(20);
    const maxX = randomPositiveNegative(40);
    const x = randomIntFromInterval(minX, maxX);

    return { degrees, x };
  }
}

function calculateDegrees(index: number): number {
  const minDeg = index * 4 + 1;
  const maxDeg = index * 5 + 5;
  return randomIntFromInterval(minDeg, maxDeg);
}

function randomIntFromInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomPositiveNegative(number: number): number {
  const sign = Math.random() < 0.5 ? -1 : 1;
  return number * sign;
}
