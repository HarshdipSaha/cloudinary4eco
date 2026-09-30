import { describe, expect, it } from "vitest";
import { formatTimestamp } from "@/domain/timecode";
import { activeObservation, markerPercent } from "@/ui/video/timeline";

describe("formatTimestamp", () => {
  it("formats minutes and tenths", () => {
    expect(formatTimestamp(6.707)).toBe("0:06.7");
    expect(formatTimestamp(75.2)).toBe("1:15.2");
    expect(formatTimestamp(0)).toBe("0:00.0");
  });
  it("carries rounding into the next minute", () => {
    expect(formatTimestamp(59.96)).toBe("1:00.0");
  });
  it("clamps negatives to zero", () => {
    expect(formatTimestamp(-3)).toBe("0:00.0");
  });
});

describe("activeObservation", () => {
  const obs = [{ assetId: "c", second: 90 }, { assetId: "a", second: 10 }, { assetId: "b", second: 50 }];
  it("is null before the first sampled frame", () => {
    expect(activeObservation(obs, 5)).toBeNull();
  });
  it("picks the latest frame at or before the playhead, regardless of input order", () => {
    expect(activeObservation(obs, 49)?.assetId).toBe("a");
    expect(activeObservation(obs, 50)?.assetId).toBe("b");
    expect(activeObservation(obs, 200)?.assetId).toBe("c");
  });
  it("treats a playhead just short of a frame as on it (seek imprecision)", () => {
    expect(activeObservation(obs, 49.9)?.assetId).toBe("b");
  });
});

describe("markerPercent", () => {
  it("places markers proportionally and clamps", () => {
    expect(markerPercent(25, 100)).toBe(25);
    expect(markerPercent(150, 100)).toBe(100);
    expect(markerPercent(-1, 100)).toBe(0);
  });
  it("returns 0 for an unknown duration", () => {
    expect(markerPercent(10, 0)).toBe(0);
    expect(markerPercent(10, Number.NaN)).toBe(0);
  });
});
