import { describe, it, expect } from "vitest";
import { statusMarkSpec, flagSpec, gradeSpec } from "@/ui/marks-spec";

describe("marks", () => {
  it("gives every evidence status a distinct glyph and a text label", () => {
    const specs = (["accepted", "needs_review", "set_aside", "pending"] as const).map(statusMarkSpec);
    expect(new Set(specs.map((s) => s.glyph)).size).toBe(4);
    expect(specs.every((s) => s.label.length > 3)).toBe(true);
    expect(statusMarkSpec("needs_review").tone).toBe("attention");
  });
  it("uses the flag tone only for integrity flags", () => {
    expect(flagSpec("recycled_image").tone).toBe("flag");
    expect(flagSpec("location_inferred").tone).toBe("note");
    expect(flagSpec("duplicate").tone).toBe("note");
  });
  it("labels grades with text and a directional glyph", () => {
    expect(gradeSpec("plantation", 0)).toMatchObject({ label: "Degraded", glyph: "▼" });
    expect(gradeSpec("plantation", 3)).toMatchObject({ label: "Established", glyph: "▲" });
  });
});
