import { describe, it, expect } from "vitest";
import { haversineM, nearestSites } from "@/domain/geo";
import { hamming } from "@/domain/phash";
import { timepointOf } from "@/domain/timepoint";

describe("haversineM", () => {
  it("measures India Gate to Rashtrapati Bhavan (~2.6 km)", () => {
    const d = haversineM({ lat: 28.6129, lon: 77.2295 }, { lat: 28.6143, lon: 77.1994 });
    expect(d).toBeGreaterThan(2800);
    expect(d).toBeLessThan(3100);
  });
  it("is zero for the same point", () => {
    expect(haversineM({ lat: 10, lon: 10 }, { lat: 10, lon: 10 })).toBe(0);
  });
});

describe("nearestSites", () => {
  const sites = [
    { id: "a", location: { lat: 28.6, lon: 77.2 } },
    { id: "b", location: { lat: 28.7, lon: 77.2 } },
    { id: "c", location: { lat: 28.601, lon: 77.2 } },
  ];
  it("sorts by distance and respects maxM and limit", () => {
    const r = nearestSites({ lat: 28.6, lon: 77.2 }, sites, { maxM: 5000, limit: 5 });
    expect(r.map((s) => s.site.id)).toEqual(["a", "c"]);
    expect(r[1]!.distanceM).toBeGreaterThan(100);
  });
});

describe("hamming", () => {
  it("counts differing bits of 64-bit hex hashes", () => {
    expect(hamming("ffffffffffffffff", "ffffffffffffffff")).toBe(0);
    expect(hamming("0000000000000000", "000000000000000f")).toBe(4);
    expect(hamming("0000000000000000", "ffffffffffffffff")).toBe(64);
  });
  it("returns null for malformed input", () => {
    expect(hamming("xyz", "0000000000000000")).toBeNull();
  });
});

describe("timepointOf", () => {
  it("buckets by IST calendar date", () => {
    expect(timepointOf("2026-09-25T20:00:00Z")).toBe("2026-09-26"); // 01:30 IST next day
    expect(timepointOf("2026-09-25T10:00:00+05:30")).toBe("2026-09-25");
  });
});
