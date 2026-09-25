import { unzip, strFromU8 } from "fflate";
import { parseWhatsAppChat, type ChatAttachment } from "@/domain/whatsapp";

const IMAGE = /\.(jpe?g|png|webp|heic)$/i;

export async function unpackFiles(files: File[]) {
  const images: File[] = [];
  const skipped: string[] = [];
  let meta = new Map<string, ChatAttachment>();
  for (const f of files) {
    if (/\.zip$/i.test(f.name)) {
      const bytesIn = new Uint8Array(await f.arrayBuffer());
      const entries = await new Promise<Record<string, Uint8Array>>((res, rej) =>
        unzip(bytesIn, (e, d) => (e ? rej(e) : res(d)))
      );
      for (const [name, bytes] of Object.entries(entries)) {
        const base = name.split("/").pop()!;
        if (/_chat\.txt$|^WhatsApp Chat.*\.txt$/i.test(base)) {
          meta = new Map([...meta, ...parseWhatsAppChat(strFromU8(bytes))]);
        } else if (IMAGE.test(base)) {
          images.push(
            new File([bytes as unknown as BlobPart], base, {
              type: base.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg",
            })

          );
        } else if (base) {
          skipped.push(base);
        }
      }
    } else if (/_chat\.txt$/i.test(f.name)) {
      meta = new Map([...meta, ...parseWhatsAppChat(await f.text())]);
    } else if (IMAGE.test(f.name) || f.type.startsWith("image/")) {
      images.push(f);
    } else {
      skipped.push(f.name);
    }
  }
  return { images, meta, skipped };
}
