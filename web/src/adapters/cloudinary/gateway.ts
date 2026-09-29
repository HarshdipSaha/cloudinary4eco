import "server-only";
import { v2 as cloudinary } from "cloudinary";
import type { MediaPort, UploadSignature } from "@/ports/media";
import { toMediaAnalysis } from "./analysis";

/** Analysis params that Task 3 proved work on this account. Remove any that FAILED in probe-report.json. */
export const ANALYSIS_UPLOAD_PARAMS: Record<string, string> = {
  image_metadata: "true",
  phash: "true",
  faces: "true",
};

export function cloudinaryGateway(): MediaPort {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return {
    async analyze(assetId) {
      const r = await cloudinary.api.resource(assetId, { image_metadata: true, phash: true, faces: true, tags: true, context: true });
      return toMediaAnalysis(r);
    },

    signUpload({ folder, context }) {
      const timestamp = Math.round(Date.now() / 1000);
      const params: Record<string, string> = { ...ANALYSIS_UPLOAD_PARAMS, folder, timestamp: String(timestamp) };
      if (context) params.context = Object.entries(context).map(([k, v]) => `${k}=${v.replaceAll("|", " ").replaceAll("=", " ")}`).join("|");
      const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
      const sig: UploadSignature = {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        timestamp,
        signature,
        params,
      };
      return sig;
    },

    async setContext(assetId, context) {
      const ctx = Object.entries(context).map(([k, v]) => `${k}=${v}`).join("|");
      await cloudinary.uploader.add_context(ctx, [assetId]);
    },

    async destroy(assetId) {
      const result = await cloudinary.uploader.destroy(assetId, { resource_type: "image", invalidate: true });
      if (result.result !== "ok" && result.result !== "not found") {
        throw new Error(`Cloudinary could not delete ${assetId}: ${result.result}`);
      }
    },

    async searchIds(expression, max) {
      const res = await cloudinary.search.expression(expression).max_results(max).execute();
      return (res.resources as { public_id: string }[]).map((r) => r.public_id);
    },
  };
}
