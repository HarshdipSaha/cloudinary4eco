import type { MediaAnalysis } from "@/domain/types";

export interface UploadSignature {
  cloudName: string; apiKey: string; timestamp: number; signature: string;
  params: Record<string, string>; // exactly the params that were signed; client must send all of them
}

export interface MediaPort {
  analyze(assetId: string): Promise<MediaAnalysis>;
  signUpload(input: { folder: string; context?: Record<string, string> }): UploadSignature;
  setContext(assetId: string, context: Record<string, string>): Promise<void>;
  /** Returns asset ids matching a Cloudinary search expression (filters only, no free text). */
  searchIds(expression: string, max: number): Promise<string[]>;
}
