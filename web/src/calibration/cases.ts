import { createHash } from "node:crypto";
import { z } from "zod";
import { PROJECT_TYPES, RELEVANCE } from "@/domain/types";

const Card = z.object({
  caption: z.string().nullable(),
  tags: z.array(z.string()),
  ocrText: z.string().nullable(),
  comment: z.string().nullable(),
  filename: z.string().nullable(),
  capturedAt: z.string().nullable(),
});
const base = {
  id: z.string().regex(/^[a-z0-9_-]+$/),
  origin: z.enum(["authored", "ledger"]),
  note: z.string().min(3),
  projectType: z.enum(PROJECT_TYPES),
};

const RelevanceCase = z.object({ ...base, kind: z.literal("triage_relevance"), card: Card, label: z.enum(RELEVANCE) });
const SiteCase = z
  .object({
    ...base,
    kind: z.literal("triage_site"),
    card: Card,
    candidateSites: z
      .array(z.object({ id: z.string(), name: z.string(), description: z.string(), distanceM: z.number().nullable() }))
      .min(1),
    label: z.string(),
  })
  .refine((c) => c.label === "none" || c.candidateSites.some((s) => s.id === c.label), {
    message: "label must be a candidate site id or none",
  });
const GradeCase = z.object({
  ...base,
  kind: z.literal("src_grade"),
  input: z.object({
    baselineCaption: z.string().nullable(),
    followupCaption: z.string().nullable(),
    registrationQuality: z.enum(["good", "weak", "failed"]),
    daysSinceBaseline: z.number().int().nonnegative(),
    metrics: z
      .object({
        vegetationFractionBefore: z.number(),
        vegetationFractionAfter: z.number(),
        vegetationDelta: z.number(),
        changedAreaFraction: z.number(),
        brightnessShift: z.number(),
      })
      .nullable(),
  }),
  label: z.number().int().min(0).max(3),
});

export const CalibrationCase = z.union([RelevanceCase, SiteCase, GradeCase]);
export type CalibrationCase = z.infer<typeof CalibrationCase>;

export function parseCases(text: string): CalibrationCase[] {
  const seen = new Set<string>();
  return text.split(/\r?\n/).flatMap((line, i) => {
    if (!line.trim()) return [];
    const parsed = CalibrationCase.safeParse(JSON.parse(line));
    if (!parsed.success) throw new Error(`calibration case line ${i + 1}: ${parsed.error.issues.map((x) => x.message).join("; ")}`);
    if (seen.has(parsed.data.id)) throw new Error(`calibration case line ${i + 1}: duplicate id ${parsed.data.id}`);
    seen.add(parsed.data.id);
    return [parsed.data];
  });
}

export const casesSha256 = (text: string) => createHash("sha256").update(text.replaceAll("\r\n", "\n")).digest("hex");
