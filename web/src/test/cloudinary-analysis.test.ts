import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { toMediaAnalysis } from "@/adapters/cloudinary/analysis";

const fx = (name: string) => JSON.parse(readFileSync(`src/test/fixtures/cloudinary/${name}`, "utf8"));

describe("toMediaAnalysis", () => {
  it("extracts id, url, size, phash, faces, GPS and capture time from a real resource", () => {
    const a = toMediaAnalysis(fx("resource-base.json"));
    expect(a.assetId).toMatch(/probe/);
    expect(a.secureUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(a.width).toBeGreaterThan(0);
    expect(a.phash).toMatch(/^[0-9a-f]{16}$/);
    expect(a.gps).not.toBeNull();
    expect(a.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("lists missing signals instead of inventing them", () => {
    const a = toMediaAnalysis({ public_id: "p", secure_url: "https://res.cloudinary.com/x/p.jpg", width: 10, height: 10, tags: [] });
    expect(a.caption).toBeNull();
    expect(a.gps).toBeNull();
    expect(a.missingSignals).toEqual(expect.arrayContaining(["caption", "gps", "capture_time", "phash"]));
  });

  it.runIf(existsSync("src/test/fixtures/cloudinary/resource-captioning.json"))("reads the caption when captioning worked", () => {
    const a = toMediaAnalysis(fx("resource-captioning.json"));
    expect(a.caption && a.caption.length).toBeGreaterThan(5);
  });
});
