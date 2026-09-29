import { v2 as cloudinary } from "cloudinary";
import { nanoid } from "nanoid";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const sourceUrl = process.env.PUBLIC_VIDEO_PROBE_URL ?? "https://res.cloudinary.com/demo/video/upload/dog.mp4";
const folder = `saakshya/probes/public-video-${nanoid(8)}`;
let videoId: string | null = null;
const frameIds: string[] = [];

try {
  const video = await cloudinary.uploader.upload(sourceUrl, {
    resource_type: "video",
    folder,
    unique_filename: true,
    use_filename: false,
  });
  videoId = video.public_id;
  const duration = Number(video.duration ?? 0);
  const offsets = [0.1, 0.5, 0.9].map((ratio) => Number((duration * ratio).toFixed(3)));
  for (const atSecond of offsets) {
    const frameUrl = cloudinary.url(video.public_id, {
      secure: true,
      resource_type: "video",
      transformation: [{ start_offset: atSecond, fetch_format: "jpg" }],
    });
    const frame = await cloudinary.uploader.upload(frameUrl, {
      resource_type: "image",
      folder,
      public_id: `probe-frame-${String(atSecond).replaceAll(".", "_")}`,
      overwrite: true,
    });
    frameIds.push(frame.public_id);
  }
  console.log(JSON.stringify({
    ok: true,
    sourceHost: new URL(sourceUrl).hostname,
    durationSeconds: duration,
    width: video.width,
    height: video.height,
    frameCount: frameIds.length,
  }, null, 2));
} finally {
  await Promise.all(frameIds.map((id) => cloudinary.uploader.destroy(id, { resource_type: "image", invalidate: true }).catch(() => undefined)));
  if (videoId) await cloudinary.uploader.destroy(videoId, { resource_type: "video", invalidate: true }).catch(() => undefined);
}
