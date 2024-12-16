import { expect } from "jsr:@std/expect";
import { calculateYAxis } from "./calculate-y-axis.ts";
import { PhotoPosition } from "./types.ts";

Deno.test("calculateYAxis", async (t) => {
  await t.step("Should return 0 when on top", () => {
    const position: PhotoPosition<string> = {
      element: "@",
      i: 2,
      prevI: 1,
      len: 2,
      pos: "T",
      prevPos: "A",
    };

    expect(calculateYAxis(position, 10)).toEqual(0);
  });

  await t.step("Should return 10 when is Below on Index 1", () => {
    const position: PhotoPosition<string> = {
      element: "@",
      i: 1,
      prevI: 2,
      len: 2,
      pos: "B",
      prevPos: "T",
    };

    expect(calculateYAxis(position, 10)).toEqual(10);
  });

  await t.step("Should return 20 when is Below on Index 0", () => {
    const position: PhotoPosition<string> = {
      element: "@",
      i: 0,
      prevI: 1,
      len: 2,
      pos: "B",
      prevPos: "B",
    };

    expect(calculateYAxis(position, 10)).toEqual(10);
  });

  await t.step("Should return -10 when is Above on Index 1", () => {
    const position: PhotoPosition<string> = {
      element: "@",
      i: 1,
      prevI: 2,
      len: 2,
      pos: "A",
      prevPos: "T",
    };

    expect(calculateYAxis(position, 10)).toEqual(-10);
  });

  await t.step("Should return -20 when is Above on Index 0", () => {
    const position: PhotoPosition<string> = {
      element: "@",
      i: 0,
      prevI: 1,
      len: 2,
      pos: "A",
      prevPos: "A",
    };

    expect(calculateYAxis(position, 10)).toEqual(-10);
  });
});
