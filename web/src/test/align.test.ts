import { describe, it, expect } from "vitest";
import { alignmentScore, toEdges } from "@/ui/witness/align";

function rgbaNoise(w: number, h: number, seed: number) {
  let x = seed;
  const a = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < a.length; i += 4) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    const v = x % 256;
    a[i] = a[i + 1] = a[i + 2] = v;
    a[i + 3] = 255;
  }
  return a;
}

function shift(src: Uint8ClampedArray, w: number, h: number, dx: number) {
  const out = new Uint8ClampedArray(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.min(w - 1, Math.max(0, x - dx));
      for (let c = 0; c < 4; c++) {
        out[(y * w + x) * 4 + c] = src[(y * w + sx) * 4 + c]!;
      }
    }
  }
  return out;
}

describe("alignmentScore", () => {
  const w = 64,
    h = 48;
  const ghost = toEdges(rgbaNoise(w, h, 7), w, h);

  it("is ~1 for the same view", () => {
    expect(alignmentScore(ghost, toEdges(rgbaNoise(w, h, 7), w, h))).toBeGreaterThan(0.95);
  });

  it("drops when the framing is off", () => {
    expect(alignmentScore(ghost, toEdges(shift(rgbaNoise(w, h, 7), w, h, 6), w, h))).toBeLessThan(0.5);
  });

  it("is near 0 for an unrelated view", () => {
    expect(Math.abs(alignmentScore(ghost, toEdges(rgbaNoise(w, h, 99), w, h)))).toBeLessThan(0.2);
  });
});
