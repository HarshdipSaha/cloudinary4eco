import type { RegistrationPort } from "@/ports/registration";
import { RegistrationUnavailable } from "@/ports/registration";
import type { RegistrationResult } from "@/domain/types";

export function cvRegistration(baseUrl = process.env.CV_WORKER_URL!, key = process.env.CV_WORKER_KEY!): RegistrationPort {
  return {
    async register(input) {
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/register`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-worker-key": key },
          body: JSON.stringify({
            site_id: input.siteId,
            baseline_asset_id: input.baselineAssetId, baseline_url: input.baselineUrl,
            followup_asset_id: input.followupAssetId, followup_url: input.followupUrl,
            folder: `${process.env.CLOUDINARY_FOLDER ?? "saakshya"}/derived/${input.siteId}`,
          }),
          signal: AbortSignal.timeout(60_000),
        });
      } catch (e) {
        throw new RegistrationUnavailable(`CV worker unreachable: ${(e as Error).message}`);
      }
      if (!res.ok) throw new RegistrationUnavailable(`CV worker error ${res.status}: ${await res.text()}`);
      const j = await res.json();
      const r: RegistrationResult = {
        quality: j.quality, inliers: j.inliers, inlierRatio: j.inlier_ratio, homography: j.homography,
        alignedAssetId: j.aligned_asset_id, differenceAssetId: j.difference_asset_id, inlierPoints: j.inlier_points,
        metrics: j.metrics && {
          vegetationFractionBefore: j.metrics.vegetation_fraction_before,
          vegetationFractionAfter: j.metrics.vegetation_fraction_after,
          vegetationDelta: j.metrics.vegetation_delta,
          changedAreaFraction: j.metrics.changed_area_fraction,
          brightnessShift: j.metrics.brightness_shift,
        },
      };
      return r;
    },
  };
}
