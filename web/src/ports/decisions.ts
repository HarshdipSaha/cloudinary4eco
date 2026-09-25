import type { ChangeMetrics, Decision, ProjectType, RegistrationQuality, Relevance, WitnessAgreement } from "@/domain/types";

export class DecisionsUnavailable extends Error {
  constructor(message: string) { super(message); this.name = "DecisionsUnavailable"; }
}

export interface AssetCard {
  caption: string | null; tags: string[]; ocrText: string | null;
  comment: string | null; filename: string | null; capturedAt: string | null;
}

export interface TriageInput {
  assetId: string;
  card: AssetCard;
  projectType: ProjectType;
  /** Empty when the site is already known (witness QR submissions). */
  candidateSites: { id: string; name: string; description: string; distanceM: number | null }[];
}

export interface TriageResult {
  assetId: string;
  site: Decision<string> | null; // answer is a site id or "none"
  relevance: Decision<Relevance>;
  activity: Decision<string>;
}

export interface GradeInput {
  siteId: string; timepoint: string; projectType: ProjectType;
  baselineCaption: string | null; followupCaption: string | null;
  metrics: ChangeMetrics | null; registrationQuality: RegistrationQuality; daysSinceBaseline: number;
}

export interface AgreementInput {
  siteId: string; claimText: string;
  implementerSummary: string[]; witnessSummary: string[];
}

export interface DecisionsPort {
  triage(inputs: TriageInput[]): Promise<TriageResult[]>;
  gradeSite(input: GradeInput): Promise<Decision<number>>;
  witnessAgreement(input: AgreementInput): Promise<Decision<WitnessAgreement>>;
  sentenceSupport(items: { id: string; sentence: string; facts: string[] }[]): Promise<Decision<boolean>[]>;
  searchRelevance(query: string, cards: { id: string; text: string }[]): Promise<Decision<number>[]>;
}
