/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

(function () {
  const REGEX_TRANSFORM =
    /(translate3d\(([-+]?[0-9]+px,?\s?){3}\))\s?(rotate\([-+]?[0-9]+deg\))/gi;
  const REGEX_TRANSLATE3D =
    /translate3d\(((-?[0-9]+)px,?\s?)(((\+|-)?[0-9]+)px,?\s?)(((\+|-)?[0-9]+)px,?\s?)\)/gi;
  const Z_AXIS_CHANGE = 10;
  const Y_AXIS_CHANGE = 20;

  class PhotoStack {
    private photos: NodeListOf<HTMLElement>;
    private stackSelector: string;
    private slideSelector: string;
    private zAxisChange: number;
    private yAxisChange: number;

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
    }

    async init() {
      await waitForAllToLoad(this.photos);

      const scrambledPhotos = this.calculateScramblePositions(this.photos);

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
              (maxLength, index) => (index === 0 ? maxLength : index - 1),
              (element, index, last) => {
                if (index !== last) return;

                const { x, degrees } = findOriginalOrThrow(scrambled, element);
                const y = this.yAxisChange * last;
                const z = this.zAxisChange * last;

                element.style.transform =
                  `translate3d(${x}px, ${y}px, -${z}px) rotate(${degrees}deg)`;
                element.style.zIndex = "-2";
                element.style.transitionDuration = "150ms";
              },
            );
            break;
          case "DOWN":
            sortedPhotos = this.sortPhotos(
              photos,
              (maxLength, index) => (index === 0 ? maxLength : index - 1),
              (element, index, last) => {
                if (index !== last) return;
                const { x, degrees } = findOriginalOrThrow(scrambled, element);
                const y = this.yAxisChange * last;
                const z = this.zAxisChange * last;

                element.style.transform =
                  `translate3d(${x}px, -${y}px, -${z}px) rotate(${degrees}deg)`;
                element.style.zIndex = "-2";
                element.style.transitionDuration = "150ms";
              },
            );
            break;
        }

        setTimeout(() => {
          this.animateOnMovement(sortedPhotos, direction, scrambled);
        }, 50);

        isThrottled = true;
        setTimeout(() => (isThrottled = false), 600);
      });
    }

    private animateOnMovement(
      elements: HTMLElement[],
      direction: Direction,
      scrambled: ScrambledData[],
    ) {
      const last = elements.length - 1;
      elements.forEach((element, index) => {
        const newZ = this.calculateZAxis(element, index, last);
        const newY = this.calculateYAxis(element, index, last, direction);
        const { x, degrees } = findOriginalOrThrow(scrambled, element);

        // This means the photo is on top of the stack, so we want to restore the original "Y" value and reset the "Z" to 0
        if (index === last) {
          setTimeout(() => {
            element.style.zIndex = "0";
          }, 1);

          setTimeout(() => {
            element.style.transform =
              `translate3d(${x}px, 0px, 0px) rotate(${degrees}deg)`;
            element.style.transformOrigin = "";
            element.style.zIndex = "0";
          }, 50);
        } else {
          element.style.transitionDuration = "300ms";
          element.style.transform =
            `translate3d(${x}px, ${newY}px, ${newZ}px) rotate(${degrees}deg)`;
        }

        setTimeout(() => (element.style.transitionDuration = "0ms"), 300);
      });
    }

    private sortPhotos(
      elms: NodeListOf<HTMLElement>,
      sortCb: (maxLength: number, index: number) => number,
      beforeRenderCb: (
        element: HTMLElement,
        index: number,
        last: number,
      ) => void,
    ): HTMLElement[] {
      if (elms.length === 0) return Array.from(elms);

      const firstElement = elms[0];
      if (!firstElement) throw new Error("Could not find first element");

      const parent = firstElement.parentNode;
      if (!parent) return Array.from(elms);

      const last = elms.length - 1;
      const elements = Array.from(elms)
        .map((element, index) => {
          const newIndex = sortCb(last, index);

          return { element, newIndex };
        })
        .sort((a, b) => a.newIndex - b.newIndex)
        .map(({ element }) => element);

      elements.forEach((element, index) => {
        element.remove();
        beforeRenderCb(element, index, last);

        parent.appendChild(element);
      });

      return elements;
    }

    private calculateZAxis(el: HTMLElement, index: number, last: number) {
      const { z } = getTransform(el);
      const isMain = index === last;

      if (isMain) {
        return 0;
      }

      if (z === 0) {
        return -this.zAxisChange * (last - index);
      }

      return z - this.zAxisChange;
    }

    private calculateYAxis(
      el: HTMLElement,
      index: number,
      last: number,
      direction: Direction,
    ): number {
      const { y } = getTransform(el);
      const isMain = index === last;

      if (isMain) {
        return 0;
      }

      if (direction === "DOWN") {
        if (y === 0) {
          return this.yAxisChange * (last - index);
        }

        return y + this.yAxisChange;
      }

      if (y === 0) {
        return -this.yAxisChange * (last - index);
      }

      return y - this.yAxisChange;
    }

    private calculateScramblePositions(
      elements: NodeListOf<HTMLElement>,
    ): ScrambledData[] {
      const last = elements.length - 1;

      const scrambled: ScrambledData[] = [];
      for (const [i, photo] of elements.entries()) {
        const y = this.calculateYAxis(photo, i, last, "DOWN");
        const z = this.calculateZAxis(photo, i, last);
        const { degrees, x } = this.calculateScramblePosition(i, last);
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

  window.PhotoStack = PhotoStack;

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

  function findOriginalOrThrow(
    scrambled: ScrambledData[],
    element: HTMLElement,
  ) {
    const original = scrambled.find(({ photo }) => photo === element);
    if (!original) {
      throw new Error("Could not find original");
    }

    return original;
  }

  function randomIntFromInterval(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  function randomPositiveNegative(number: number): number {
    const sign = Math.random() < 0.5 ? -1 : 1;
    return number * sign;
  }

  function waitForAllToLoad(
    photoSliders: NodeListOf<HTMLElement>,
  ): Promise<void> {
    const loaded = [];
    const waitToLoad = async () => {
      for (const slide of photoSliders) {
        const photo = slide.querySelector<HTMLImageElement>("img");

        if (!photo) {
          throw new Error("Could not find image");
        }

        photo.onload = (event) => {
          if (!event.target) return;

          loaded.push(event.target);
        };
      }

      let index = 0;
      let totalWaitingTime = 0;
      let waitTime = 0;
      while (true) {
        if (loaded.length === photoSliders.length) {
          return;
        }

        if (index === 500) {
          throw new Error("Could not load all photos");
        }

        waitTime = Math.log(index + 1) * 50;
        totalWaitingTime += waitTime;
        await waitFor(waitTime);
        index++;
      }
    };

    return new Promise((resolve, reject) => {
      waitToLoad().then(resolve).catch(reject);
    });
  }

  function waitFor(ms = 50): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }
})();

interface ScrambledData {
  photo: HTMLElement;
  x: number;
  y: number;
  z: number;
  degrees: number;
}

interface TransformData {
  x: number;
  y: number;
  z: number;
  rotate: string;
}

interface ScrambledPosition {
  degrees: number;
  x: number;
}

type Direction = "UP" | "DOWN";
