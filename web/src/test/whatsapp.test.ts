import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseWhatsAppChat } from "@/domain/whatsapp";

const read = (f: string) => readFileSync(`src/test/fixtures/whatsapp/${f}`, "utf8");

describe("parseWhatsAppChat", () => {
  it("maps Android attachments to sent time (IST) and sender, with the following caption line", () => {
    const m = parseWhatsAppChat(read("android.txt"));
    expect(m.get("IMG-20260925-WA0003.jpg")).toEqual({ sentAt: "2026-09-25T10:12:00+05:30", sender: "Riya", comment: "Plot B, after digging" });
    expect(m.get("IMG-20260925-WA0007.jpg")?.sentAt).toBe("2026-09-25T18:05:00+05:30");
    expect(m.size).toBe(2);
  });
  it("maps iOS attachments", () => {
    const m = parseWhatsAppChat(read("ios.txt"));
    expect(m.get("00000012-PHOTO-2026-09-25-10-12-44.jpg")).toEqual({ sentAt: "2026-09-25T10:12:44+05:30", sender: "Riya", comment: null });
  });
});
