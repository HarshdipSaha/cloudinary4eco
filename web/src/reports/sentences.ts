export interface DraftSentence {
  section: "findings" | "impression";
  text: string;
  factIds: string[];
}

const HEADING = /^\s*#*\s*\**\s*(findings|impression)\s*\**\s*:?\s*$/i;
const CITE = /\[(F\d+)\]/g;

export function splitDraft(draft: string): DraftSentence[] {
  const out: DraftSentence[] = [];
  let section: DraftSentence["section"] = "findings";
  for (const rawLine of draft.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const h = line.match(HEADING);
    if (h) {
      section = h[1]!.toLowerCase() as DraftSentence["section"];
      continue;
    }
    const chunks = line.match(/.+?[.!?](?:\s*\[F\d+\])*(?=\s|$)|.+$/g) ?? [];
    for (const chunk of chunks) {
      const factIds = [...chunk.matchAll(CITE)].map((m) => m[1]!);
      const text = chunk
        .replace(CITE, "")
        .replace(/\s+([.!?,;:])/g, "$1")
        .replace(/\s{2,}/g, " ")
        .replace(/\*\*/g, "")
        .trim();
      if (text) out.push({ section, text, factIds });
    }
  }
  return out;
}
