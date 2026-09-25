export interface ChatAttachment { sentAt: string; sender: string; comment: string | null }

const ANDROID = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}), (\d{1,2}):(\d{2})\s*(am|pm)? - ([^:]+): (.+?) \(file attached\)\s*$/i;
const IOS = /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}), (\d{1,2}):(\d{2}):(\d{2})\] ([^:]+): ‎?<attached: (.+?)>\s*$/;
const ANY_MESSAGE_START = /^(\[?\d{1,2}\/\d{1,2}\/\d{2,4}, )/;

const pad = (n: number | string) => String(n).padStart(2, "0");
function year(y: string) { return y.length === 2 ? `20${y}` : y; }
function hour24(h: string, ampm?: string) {
  let n = Number(h);
  if (ampm) {
    const pm = ampm.toLowerCase() === "pm";
    if (pm && n < 12) n += 12;
    if (!pm && n === 12) n = 0;
  }
  return pad(n);
}

/** Parses an exported WhatsApp chat (dd/mm/yy, India locale) into filename → attachment info. */
export function parseWhatsAppChat(text: string): Map<string, ChatAttachment> {
  const out = new Map<string, ChatAttachment>();
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const a = line.match(ANDROID);
    if (a) {
      const [, d, mo, y, h, mi, ampm, sender, file] = a;
      const next = lines[i + 1];
      const comment = next && !ANY_MESSAGE_START.test(next) && next.trim() ? next.trim() : null;
      out.set(file!.trim(), {
        sentAt: `${year(y!)}-${pad(mo!)}-${pad(d!)}T${hour24(h!, ampm)}:${mi}:00+05:30`,
        sender: sender!.trim(),
        comment,
      });
      continue;
    }
    const b = line.match(IOS);
    if (b) {
      const [, d, mo, y, h, mi, s, sender, file] = b;
      out.set(file!.trim(), {
        sentAt: `${year(y!)}-${pad(mo!)}-${pad(d!)}T${pad(h!)}:${mi}:${s}+05:30`,
        sender: sender!.trim(),
        comment: null,
      });
    }
  }
  return out;
}
