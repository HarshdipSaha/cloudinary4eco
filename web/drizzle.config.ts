import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read .env.local on its own.
try { process.loadEnvFile(".env.local"); } catch { /* CI provides DATABASE_URL directly */ }

export default defineConfig({
  schema: "./src/ledger/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
