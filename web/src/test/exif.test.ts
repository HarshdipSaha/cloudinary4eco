import { describe, it, expect } from "vitest";
import { parseDms, parseExifDate, gpsFromMetadata, capturedAtFromMetadata } from "@/domain/exif";

describe("parseDms", () => {
  it("parses ExifTool DMS strings with hemisphere", () => {
    expect(parseDms(`28 deg 36' 50.40" N`)).toBeCloseTo(28.614, 3);
    expect(parseDms(`77 deg 12' 34.00" E`)).toBeCloseTo(77.2094, 3);
    expect(parseDms(`33 deg 51' 54.00" S`)).toBeCloseTo(-33.865, 3);
  });
  it("accepts plain decimals", () => {
    expect(parseDms("28.6140")).toBeCloseTo(28.614, 4);
  });
  it("returns null for junk", () => {
    expect(parseDms("unknown")).toBeNull();
  });
});

describe("gpsFromMetadata", () => {
  it("uses GPSLatitude/GPSLongitude with refs", () => {
    const g = gpsFromMetadata({ GPSLatitude: `28 deg 36' 50.40"`, GPSLatitudeRef: "North", GPSLongitude: `77 deg 12' 34.00"`, GPSLongitudeRef: "East" });
    expect(g?.lat).toBeCloseTo(28.614, 3);
    expect(g?.lon).toBeCloseTo(77.2094, 3);
  });
  it("is null when absent or zero", () => {
    expect(gpsFromMetadata({})).toBeNull();
    expect(gpsFromMetadata({ GPSLatitude: "0", GPSLongitude: "0" })).toBeNull();
  });
});

describe("capturedAtFromMetadata", () => {
  it("reads DateTimeOriginal as IST when no offset tag", () => {
    expect(parseExifDate("2026:09:25 10:11:12")).toBe("2026-09-25T10:11:12+05:30");
    expect(capturedAtFromMetadata({ DateTimeOriginal: "2026:09:25 10:11:12", OffsetTimeOriginal: "+05:30" })).toBe("2026-09-25T10:11:12+05:30");
  });
  it("prefers OffsetTimeOriginal when present", () => {
    expect(capturedAtFromMetadata({ DateTimeOriginal: "2026:09:25 10:11:12", OffsetTimeOriginal: "+00:00" })).toBe("2026-09-25T10:11:12+00:00");
  });
  it("is null when missing", () => {
    expect(capturedAtFromMetadata({})).toBeNull();
  });
});
