import { v2 as cloudinary } from "cloudinary";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const file = process.argv[2];
if (!file) throw new Error("usage: npm run probe:cloudinary -- <path-to-real-field-photo.jpg>");
const outDir = path.join("src", "test", "fixtures", "cloudinary");
mkdirSync(outDir, { recursive: true });

// Each option is tried alone so one missing add-on does not hide the others.
const candidates: Record<string, Record<string, unknown>> = {
  base: { image_metadata: true, phash: true, faces: true },
  captioning: { detection: "captioning" },
  google_tagging: { categorization: "google_tagging", auto_tagging: 0.6 },
  aws_rek_tagging: { categorization: "aws_rek_tagging", auto_tagging: 0.6 },
  cld_tagging: { detection: "coco_v2", auto_tagging: 0.6 },
  adv_ocr: { ocr: "adv_ocr" },
};

const report: Record<string, string> = {};
for (const [name, opts] of Object.entries(candidates)) {
  try {
    const res = await cloudinary.uploader.upload(file, {
      folder: `${process.env.CLOUDINARY_FOLDER ?? "saakshya"}/probe`,
      ...opts,
    });
    writeFileSync(path.join(outDir, `upload-${name}.json`), JSON.stringify(res, null, 2));
    const full = await cloudinary.api.resource(res.public_id, {
      image_metadata: true, phash: true, faces: true, tags: true, context: true,
    });
    writeFileSync(path.join(outDir, `resource-${name}.json`), JSON.stringify(full, null, 2));
    report[name] = "ok";
  } catch (e) {
    report[name] = `FAILED: ${(e as { message?: string }).message ?? String(e)}`;
  }
}
writeFileSync(path.join(outDir, "probe-report.json"), JSON.stringify(report, null, 2));
console.table(report);

// Delivery-side checks: print URLs to open in a browser and confirm they render.
const probeId = `${process.env.CLOUDINARY_FOLDER ?? "saakshya"}/probe`;
console.log("Open these and confirm they render (record results in probe-report.md):");
console.log(cloudinary.url(`${probeId}`, { transformation: [{ effect: "pixelate_faces:20" }] }));
