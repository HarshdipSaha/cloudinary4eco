import { describe, it, expect } from "vitest";
import { SRC, gradeLabel } from "@/domain/src-rubrics";
import { PROJECT_TYPES } from "@/domain/types";

describe("SRC rubrics", () => {
  it("defines exactly 4 ordered levels and ≥3 activities for every project type", () => {
    for (const t of PROJECT_TYPES) {
      expect(SRC[t].levels).toHaveLength(4);
      expect(Object.keys(SRC[t].activities).length).toBeGreaterThanOrEqual(3);
      expect(SRC[t].activities).toHaveProperty("other");
    }
  });
  it("labels grades", () => {
    expect(gradeLabel("plantation", 3)).toBe("Established");
    expect(gradeLabel("cleanup", 0)).toBe("Worse");
  });
});
