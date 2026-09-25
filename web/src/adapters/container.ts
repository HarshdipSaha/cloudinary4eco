import "server-only";
import { cloudinaryGateway } from "./cloudinary/gateway";
import { jevDecisions } from "./jev/client";
import { cvRegistration } from "./cv/client";
import { groqDrafter } from "./llm/groq";
import { getDb } from "@/ledger/db";

let cached: ReturnType<typeof build> | null = null;
function build() {
  return { db: getDb(), media: cloudinaryGateway(), decisions: jevDecisions(), registration: cvRegistration(), drafter: groqDrafter() };
}
export function deps() {
  cached ??= build();
  return cached;
}
