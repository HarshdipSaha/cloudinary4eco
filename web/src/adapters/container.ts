import "server-only";
import { cloudinaryGateway } from "./cloudinary/gateway";
import { jevDecisions } from "./jev/client";
import { cvRegistration } from "./cv/client";
import { groqDrafter } from "./llm/groq";
import { openMeteoWeather } from "./weather/open-meteo";
import { getDb } from "@/ledger/db";

let cached: Awaited<ReturnType<typeof build>> | null = null;
async function build() {
  return {
    db: await getDb(), media: cloudinaryGateway(), decisions: jevDecisions(), registration: cvRegistration(),
    drafter: groqDrafter(), weather: openMeteoWeather(),
  };
}
export async function deps() {
  cached ??= await build();
  return cached;
}
