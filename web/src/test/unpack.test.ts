import { describe, it, expect } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { unpackFiles } from "@/ui/intake/unpack";

describe("unpackFiles", () => {
  it("extracts images and chat metadata from a WhatsApp export ZIP", async () => {
    const zip = zipSync({
      "_chat.txt": strToU8("25/09/26, 10:12 am - Riya: IMG-20260925-WA0003.jpg (file attached)\nPlot B\n"),
      "IMG-20260925-WA0003.jpg": new Uint8Array([0xff, 0xd8, 0xff]),
      "notes.pdf": new Uint8Array([1]),
    });
    const out = await unpackFiles([new File([zip], "WhatsApp Chat.zip", { type: "application/zip" })]);
    expect(out.images.map((f) => f.name)).toEqual(["IMG-20260925-WA0003.jpg"]);
    expect(out.meta.get("IMG-20260925-WA0003.jpg")).toMatchObject({ sender: "Riya", comment: "Plot B" });
    expect(out.skipped).toEqual(["notes.pdf"]);
  });
  it("passes loose images through", async () => {
    const out = await unpackFiles([new File([new Uint8Array([1])], "a.jpg", { type: "image/jpeg" })]);
    expect(out.images).toHaveLength(1);
  });
});
