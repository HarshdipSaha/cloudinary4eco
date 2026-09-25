import { TypeSafeClient, choice, noul, score } from "@typesafe-ai/sdk";
import { writeFileSync, mkdirSync } from "node:fs";

const client = new TypeSafeClient({
  apiKey: process.env.TYPESAFE_API_KEY ?? process.env.JEV_API_KEY,
  defaultModel: process.env.TYPESAFE_DEFAULT_MODEL ?? "jev-latest",
});

const models = await client.models.list();
console.log("models:", models.map((m) => m.name).join(", "));

const started = performance.now();
const res = await client.systemOne({
  state: {
    assets: [
      { caption: "Workers planting saplings along a dirt path next to a brick wall", tags: ["tree", "soil", "people"] },
      { caption: "A screenshot of a chat conversation", tags: ["text", "screenshot"] },
    ],
  },
  questions: {
    a0_relevance: choice("Is `assets[0]` usable field evidence?", {
      evidence: "Shows the physical site or work", people_only: "Mainly a portrait or group photo",
      screenshot_or_meme: "Screenshot, meme, document photo", unusable_quality: "Too blurry, dark or obstructed",
    }),
    a1_relevance: choice("Is `assets[1]` usable field evidence?", {
      evidence: "Shows the physical site or work", people_only: "Mainly a portrait or group photo",
      screenshot_or_meme: "Screenshot, meme, document photo", unusable_quality: "Too blurry, dark or obstructed",
    }),
    a0_grade: score("How established is the planting in `assets[0]`?", [
      "Degraded", "No change", "Partially established", "Established",
    ]),
    a0_people: noul("Are people visible in `assets[0]`?"),
  },
});
const latencyMs = Math.round(performance.now() - started);
mkdirSync("src/test/fixtures/jev", { recursive: true });
writeFileSync("src/test/fixtures/jev/triage.json", JSON.stringify({ latencyMs, ...res }, null, 2));
console.log(JSON.stringify({ latencyMs, ...res }, null, 2));
