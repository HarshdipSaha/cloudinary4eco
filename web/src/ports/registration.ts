import type { RegistrationResult } from "@/domain/types";

export class RegistrationUnavailable extends Error {
  constructor(message: string) { super(message); this.name = "RegistrationUnavailable"; }
}

export interface RegistrationPort {
  register(input: { siteId: string; baselineAssetId: string; baselineUrl: string; followupAssetId: string; followupUrl: string }): Promise<RegistrationResult>;
}
