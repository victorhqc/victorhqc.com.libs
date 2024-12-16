import { waitFor } from "../utils/waitFor.ts";

export function waitForAllToLoad(
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
