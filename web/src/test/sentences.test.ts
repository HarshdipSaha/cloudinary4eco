import { describe, it, expect } from "vitest";
import { splitDraft } from "@/reports/sentences";

describe("splitDraft", () => {
  it("splits sections and sentences and extracts citations in either position", () => {
    const draft = `Findings
Plot B moved from bare ground to partial establishment. [F1][F2] Vegetation cover rose to 31% [F3].
A sentence with no receipt.

Impression
Progress is real but early. [F1]`;
    expect(splitDraft(draft)).toEqual([
      { section: "findings", text: "Plot B moved from bare ground to partial establishment.", factIds: ["F1", "F2"] },
      { section: "findings", text: "Vegetation cover rose to 31%.", factIds: ["F3"] },
      { section: "findings", text: "A sentence with no receipt.", factIds: [] },
      { section: "impression", text: "Progress is real but early.", factIds: ["F1"] },
    ]);
  });
  it("tolerates markdown headings and bold", () => {
    expect(splitDraft("## **Findings**\nOne. [F1]")[0]).toMatchObject({ section: "findings", text: "One.", factIds: ["F1"] });
  });
});
