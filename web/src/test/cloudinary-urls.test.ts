import { describe, it, expect } from "vitest";
import { urls, layerId } from "@/adapters/cloudinary/urls";

const u = urls("demo");

describe("cloudinary urls", () => {
  it("converts folder paths to layer ids", () => {
    expect(layerId("saakshya/p1/aligned/x")).toBe("saakshya:p1:aligned:x");
  });
  it("builds a plate URL with auto format/quality and width", () => {
    expect(u.plate("saakshya/a", 1200)).toBe("https://res.cloudinary.com/demo/image/upload/c_limit,w_1200/f_auto,q_auto/saakshya/a");
  });
  it("pixelates faces on public plates", () => {
    expect(u.publicPlate("saakshya/a", 800)).toContain("e_pixelate_faces:20");
  });
  it("builds a side-by-side composite with date captions", () => {
    const s = u.sideBySide({ beforeId: "saakshya/b", afterId: "saakshya/p1/aligned/x", beforeLabel: "2026-09-20", afterLabel: "2026-10-02" });
    expect(s).toContain("l_saakshya:p1:aligned:x");
    expect(s).toContain("fl_layer_apply,g_east");
    expect(s).toContain("l_text:Arial_28_bold:2026-09-20");
    expect(s).toContain("e_pixelate_faces:20");
  });
  it("builds social crops from the composite", () => {
    const sq = u.social({ beforeId: "saakshya/b", afterId: "saakshya/a" }, "1:1");
    expect(sq).toContain("ar_1:1");
    expect(sq).toContain("c_fill");
  });
  it("builds a ghost overlay URL for the capture camera", () => {
    expect(u.ghost("saakshya/b", 720)).toBe("https://res.cloudinary.com/demo/image/upload/c_limit,w_720/e_grayscale/o_100/f_auto,q_auto/saakshya/b");
  });
});
