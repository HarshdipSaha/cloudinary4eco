import { describe, it, expect } from "vitest";
import { brier, ece, reliabilityBins, pickThreshold, type Scored } from "@/domain/calibration";

const perfect: Scored[] = [
  { probabilities: { a: 1, b: 0 }, label: "a" },
  { probabilities: { a: 0, b: 1 }, label: "b" },
];
const hedged: Scored[] = [
  { probabilities: { a: 0.6, b: 0.4 }, label: "a" },
  { probabilities: { a: 0.6, b: 0.4 }, label: "b" },
];

describe("calibration metrics", () => {
  it("brier is 0 for perfect and higher for hedged-wrong", () => {
    expect(brier(perfect)).toBe(0);
    expect(brier(hedged)).toBeCloseTo(((0.4 ** 2 + 0.4 ** 2) + (0.6 ** 2 + 0.6 ** 2)) / 2, 6);
  });
  it("ece is 0 for perfect and |conf-acc| for a single bin", () => {
    expect(ece(perfect)).toBe(0);
    expect(ece(hedged)).toBeCloseTo(Math.abs(0.6 - 0.5), 6);
  });
  it("bins by top confidence", () => {
    const bins = reliabilityBins(hedged, 10);
    expect(bins.find((b) => b.count === 2)).toMatchObject({ lo: 0.6, accuracy: 0.5, confidence: 0.6 });
  });
  it("picks the lowest threshold whose accepted accuracy meets the target", () => {
    const xs: Scored[] = [
      { probabilities: { a: 0.95, b: 0.05 }, label: "a" },
      { probabilities: { a: 0.9, b: 0.1 }, label: "a" },
      { probabilities: { a: 0.7, b: 0.3 }, label: "b" },
    ];
    expect(pickThreshold(xs, 0.95)).toMatchObject({ threshold: 0.9, coverage: 2 / 3, accuracy: 1 });
  });
});
