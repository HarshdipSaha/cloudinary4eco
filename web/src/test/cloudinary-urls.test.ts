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

describe("video delivery and campaign card", () => {
  const u = urls("demo");

  it("delivers an imported video in its original format, untranscoded", () => {
    // f_auto/q_auto make Cloudinary transcode on first request and serve a growing, partial file meanwhile.
    expect(u.video("saakshya/p1/public-video/pvi_1/abc")).toBe(
      "https://res.cloudinary.com/demo/video/upload/saakshya/p1/public-video/pvi_1/abc"
    );
  });

  it("composes up to three frames with timestamp labels, a disclosure band and face pixelation", () => {
    const url = u.campaignCard({
      frames: [
        { assetId: "f/one", label: "0:10.0" },
        { assetId: "f/two", label: "0:50.0" },
      ],
      footer: "Public video · Plot B · date and GPS unverified",
    });
    expect(url.startsWith("https://res.cloudinary.com/demo/image/upload/e_pixelate_faces:20/c_fill,g_auto,w_600,h_600/")).toBe(true);
    expect(url).toContain("c_lpad,w_1200,h_680,g_north_west,b_rgb:111111");
    // Faces in overlay layers are not seen by an effect applied afterwards, so every tile is pixelated inside its own layer.
    expect(url).toContain("l_f:two/e_pixelate_faces:20/c_fill,g_auto,w_600,h_600/fl_layer_apply,g_north_west,x_600,y_0");
    expect(url).toContain("l_text:Arial_26_bold:0%3A10.0");
    expect(url).toContain("e_pixelate_faces:20");
    expect(url.endsWith("/f/one")).toBe(true);
  });

  it("refuses an empty or oversized frame list", () => {
    expect(() => u.campaignCard({ frames: [], footer: "x" })).toThrow(/one to three/);
    const four = ["a", "b", "c", "d"].map((assetId) => ({ assetId, label: "0:00.0" }));
    expect(() => u.campaignCard({ frames: four, footer: "x" })).toThrow(/one to three/);
  });
});

describe("composite helpers pixelate faces inside every layer", () => {
  const u = urls("demo");
  // An effect applied after layers are flattened does not reach faces in overlays (verified against Cloudinary).
  it("pixelates both the base and the overlay in sideBySide and social", () => {
    for (const url of [
      u.sideBySide({ beforeId: "b", afterId: "a/x", beforeLabel: "B", afterLabel: "A" }),
      u.social({ beforeId: "b", afterId: "a/x" }, "1:1"),
    ]) {
      expect(url).toContain("l_a:x/e_pixelate_faces:20/c_fill,w_800,h_800/fl_layer_apply,g_east");
      expect(url).toContain("/e_pixelate_faces:20/c_fill,w_800,h_800/c_pad");
    }
  });
});
