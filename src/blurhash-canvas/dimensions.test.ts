import { expect } from "jsr:@std/expect";
import { computeDecodeDimensions, resolveDimensions } from "./dimensions.ts";

Deno.test("resolveDimensions", async (t) => {
  await t.step("uses data attributes when present", () => {
    const result = resolveDimensions("800", "600", 0, 0, 32);
    expect(result).toEqual({ width: 800, height: 600 });
  });

  await t.step("falls back to offset dimensions", () => {
    const result = resolveDimensions(undefined, undefined, 1024, 768, 32);
    expect(result).toEqual({ width: 1024, height: 768 });
  });

  await t.step("falls back to resolution when everything is zero", () => {
    const result = resolveDimensions(undefined, undefined, 0, 0, 32);
    expect(result).toEqual({ width: 32, height: 32 });
  });

  await t.step("ignores non-numeric data attributes", () => {
    const result = resolveDimensions("abc", "xyz", 0, 0, 64);
    expect(result).toEqual({ width: 64, height: 64 });
  });

  await t.step("mixes data attribute width with offset height", () => {
    const result = resolveDimensions("400", undefined, 0, 300, 32);
    expect(result).toEqual({ width: 400, height: 300 });
  });

  await t.step("data attribute zero falls through to offset", () => {
    const result = resolveDimensions("0", "0", 500, 250, 32);
    expect(result).toEqual({ width: 500, height: 250 });
  });
});

Deno.test("computeDecodeDimensions", async (t) => {
  await t.step("square image keeps decode dimensions equal", () => {
    const result = computeDecodeDimensions(500, 500, 32);
    expect(result).toEqual({ decodeW: 32, decodeH: 32 });
  });

  await t.step("landscape image produces shorter decodeH", () => {
    const result = computeDecodeDimensions(800, 600, 32);
    // ratio = 800/600 ≈ 1.333, decodeH = round(32 / 1.333) = 24
    expect(result).toEqual({ decodeW: 32, decodeH: 24 });
  });

  await t.step("portrait image produces taller decodeH", () => {
    const result = computeDecodeDimensions(600, 800, 32);
    // ratio = 600/800 = 0.75, decodeH = round(32 / 0.75) = 43
    expect(result).toEqual({ decodeW: 32, decodeH: 43 });
  });

  await t.step("respects custom resolution", () => {
    const result = computeDecodeDimensions(1920, 1080, 64);
    // ratio = 1920/1080 ≈ 1.778, decodeH = round(64 / 1.778) = 36
    expect(result).toEqual({ decodeW: 64, decodeH: 36 });
  });

  await t.step("handles 2:1 aspect ratio", () => {
    const result = computeDecodeDimensions(200, 100, 32);
    // ratio = 2, decodeH = round(32 / 2) = 16
    expect(result).toEqual({ decodeW: 32, decodeH: 16 });
  });

  await t.step("clamps decodeH to 1 for extreme wide aspect ratios", () => {
    // ratio = 10000/1 = 10000, round(32 / 10000) = 0 → clamped to 1
    const result = computeDecodeDimensions(10000, 1, 32);
    expect(result).toEqual({ decodeW: 32, decodeH: 1 });
  });

  await t.step("clamps resolution to 1 when given 0", () => {
    const result = computeDecodeDimensions(800, 600, 0);
    expect(result).toEqual({ decodeW: 1, decodeH: 1 });
  });

  await t.step("clamps resolution to 1 when given negative value", () => {
    const result = computeDecodeDimensions(800, 600, -5);
    expect(result).toEqual({ decodeW: 1, decodeH: 1 });
  });
});
