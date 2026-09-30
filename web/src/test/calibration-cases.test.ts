import { describe, expect, it } from "vitest";
import { parseCases, casesSha256 } from "@/calibration/cases";

const relevance = {
  id: "rel_signboard_on_site", origin: "authored", note: "Signboard physically at the plot is site evidence",
  kind: "triage_relevance", projectType: "plantation",
  card: { caption: "a painted signboard beside saplings", tags: ["sign", "plant"], ocrText: "Plot B plantation", comment: null, filename: "IMG_2001.jpg", capturedAt: null },
  label: "evidence",
};

describe("parseCases", () => {
  it("parses JSON lines and skips blank lines", () => {
    expect(parseCases(`${JSON.stringify(relevance)}\n\n`)).toHaveLength(1);
  });
  it("rejects labels outside the relevance vocabulary", () => {
    expect(() => parseCases(JSON.stringify({ ...relevance, label: "unrelated" }))).toThrow(/line 1/);
  });
  it("rejects a site label that is not a candidate or none", () => {
    const site = {
      id: "site_x", origin: "authored", note: "n/a note", kind: "triage_site", projectType: "plantation", card: relevance.card,
      candidateSites: [{ id: "plot-b", name: "Plot B", description: "", distanceM: 40 }], label: "plot-z",
    };
    expect(() => parseCases(JSON.stringify(site))).toThrow(/candidate/);
  });
  it("rejects duplicate ids", () => {
    expect(() => parseCases(`${JSON.stringify(relevance)}\n${JSON.stringify(relevance)}`)).toThrow(/duplicate/);
  });
  it("hashes independently of line endings", () => {
    expect(casesSha256("a\r\nb\r\n")).toBe(casesSha256("a\nb\n"));
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PROJECT_TYPES, RELEVANCE } from "@/domain/types";
import { splitOf } from "@/calibration/evaluate";

describe("committed corpus", () => {
  // vitest runs from web/, the same working directory scripts use
  const cases = parseCases(readFileSync(resolve(process.cwd(), "calibration/cases.jsonl"), "utf8"));
  const of = (kind: string) => cases.filter((c) => c.kind === kind);

  it("has at least 30 cases per relevance class, spread over every project type", () => {
    for (const label of RELEVANCE) expect(of("triage_relevance").filter((c) => c.label === label).length).toBeGreaterThanOrEqual(30);
    for (const t of PROJECT_TYPES) expect(of("triage_relevance").filter((c) => c.projectType === t).length).toBeGreaterThanOrEqual(12);
  });
  it("has at least 60 site cases, 15 of them 'none'", () => {
    expect(of("triage_site").length).toBeGreaterThanOrEqual(60);
    expect(of("triage_site").filter((c) => c.label === "none").length).toBeGreaterThanOrEqual(15);
  });
  it("has at least 12 grade cases per SRC level", () => {
    for (const level of [0, 1, 2, 3]) expect(of("src_grade").filter((c) => c.label === level).length).toBeGreaterThanOrEqual(12);
  });
  it("has both tune and test cases, and every label class, in each split", () => {
    for (const kind of ["triage_relevance", "triage_site", "src_grade"]) {
      const splits = new Set(of(kind).map((c) => splitOf(c.id)));
      expect(splits).toEqual(new Set(["tune", "test"]));
    }
    for (const label of RELEVANCE) {
      const inTest = of("triage_relevance").filter((c) => c.label === label && splitOf(c.id) === "test").length;
      expect(inTest, `test cases for ${label}`).toBeGreaterThanOrEqual(8);
    }
  });
});
