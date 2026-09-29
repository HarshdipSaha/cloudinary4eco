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

    async importPublicVideo({ sourceUrl, folder }) {
      const result = await cloudinary.uploader.upload(sourceUrl, {
        resource_type: "video",
        folder,
        unique_filename: true,
        use_filename: false,
      });
      return {
        assetId: result.public_id,
        secureUrl: result.secure_url,
        durationSeconds: Number(result.duration ?? 0),
        width: Number(result.width ?? 0),
        height: Number(result.height ?? 0),
      };
    },

    async renderVideoFrame({ videoAssetId, atSecond, folder }) {
      const sourceUrl = cloudinary.url(videoAssetId, {
        secure: true,
        resource_type: "video",
        // The Vercel serverless bundle cannot provide Cloudinary's URL analytics
        // SDK version metadata. This URL is an internal frame fetch source, so
        // analytics are unnecessary and can make Cloudinary reject the request.
        urlAnalytics: false,
        transformation: [{ start_offset: atSecond, fetch_format: "jpg" }],
      });
      const result = await cloudinary.uploader.upload(sourceUrl, {
        resource_type: "image",
        folder,
        public_id: `frame-${String(atSecond).replaceAll(".", "_")}`,
        overwrite: true,
      });
      return toMediaAnalysis(await cloudinary.api.resource(result.public_id, { image_metadata: true, phash: true, faces: true, tags: true, context: true }));
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

    async destroyVideo(assetId) {
      const result = await cloudinary.uploader.destroy(assetId, { resource_type: "video", invalidate: true });
      if (result.result !== "ok" && result.result !== "not found") {
        throw new Error(`Cloudinary could not delete video ${assetId}: ${result.result}`);
      }
    },

    async searchIds(expression, max) {
      const res = await cloudinary.search.expression(expression).max_results(max).execute();
      return (res.resources as { public_id: string }[]).map((r) => r.public_id);
    },
  };
}
