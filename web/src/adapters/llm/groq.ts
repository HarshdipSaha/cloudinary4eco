import type { DrafterPort } from "@/ports/drafter";

const SYSTEM = `You draft donor reports for a field programme. Rules:
- Use ONLY the numbered facts provided. Do not add numbers, places, names or outcomes that are not in the facts.
- Every sentence must end with one or more citations of the facts it relies on, like [F2] or [F1][F4]. Use plain ASCII square brackets exactly as shown — never full-width or other bracket styles.
- Write two sections with these exact headings on their own lines: "Findings" then "Impression".
- Findings: 4-8 sentences, plain and specific. Impression: 2-3 sentences summarising.
- Where evidence is weak, contested or pending, say so plainly.`;

export function groqDrafter(rawApiKey = process.env.GROQ_API_KEY!, model = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b"): DrafterPort {
  const apiKey = (rawApiKey ?? "").split(",")[0]?.trim() ?? "";
  return {
    async draft({ projectName, periodStart, periodEnd, facts }) {
      const user = `Project: ${projectName}\nPeriod: ${periodStart} to ${periodEnd}\nFacts:\n${facts.map((f) => `[${f.id}] ${f.text}`).join("\n")}`;
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ model, temperature: 0.2, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }] }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`Drafter error ${res.status}: ${await res.text()}`);
      const j = await res.json();
      return String(j.choices?.[0]?.message?.content ?? "");
    },
  };
}
