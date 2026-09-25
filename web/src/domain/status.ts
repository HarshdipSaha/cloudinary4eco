import type { Decision, EvidenceStatus, Flag, Relevance, RegistrationQuality } from "./types";
import { INTEGRITY_FLAGS } from "./types";
import { THRESHOLDS } from "./thresholds";

export interface StatusInput {
  relevance: Decision<Relevance>;
  site: Decision<string> | null; // null when the site was known (witness QR)
  siteId: string | null;
  flags: Flag[];
  registration: { quality: RegistrationQuality } | null;
}

export function decideStatus(x: StatusInput): { status: EvidenceStatus; reason: string | null } {
  const confident = (c: number) => c >= THRESHOLDS.choiceAccept;

  if (x.relevance.answer !== "evidence" && confident(x.relevance.confidence)) {
    return { status: "set_aside", reason: `Not field evidence: ${x.relevance.answer}` };
  }
  const integrity = x.flags.filter((f) => INTEGRITY_FLAGS.includes(f.kind));
  if (integrity.length) {
    return { status: "needs_review", reason: `Integrity: ${integrity.map((f) => f.kind).join(", ")}` };
  }
  if (x.flags.some((f) => f.kind === "duplicate")) {
    return { status: "set_aside", reason: "Duplicate of another photo from the same visit" };
  }
  if (!x.siteId) return { status: "needs_review", reason: "No matching site" };
  if (!confident(x.relevance.confidence) || (x.site && !confident(x.site.confidence))) {
    return { status: "needs_review", reason: "Low decision confidence" };
  }
  if (x.registration && x.registration.quality !== "good") {
    return { status: "needs_review", reason: `Registration ${x.registration.quality}` };
  }
  return { status: "accepted", reason: null };
}
