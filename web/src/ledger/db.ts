import * as schema from "./schema";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export type Db = PgDatabase<any, typeof schema>;

let prod: Db | null = null;
let migrationDone = false;

/** Production database (Neon over HTTP if DATABASE_URL is set, otherwise persistent PGlite). */
export function getDb(): Db {
  if (prod) return prod;

  if (process.env.DATABASE_URL) {
    prod = drizzleNeon(neon(process.env.DATABASE_URL), { schema }) as unknown as Db;
    return prod;
  }

  // Fallback to local persistent PGlite
  const dataDir = resolve(process.cwd(), ".data/pglite");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  const client = new PGlite(dataDir);
  const db = drizzlePglite(client, { schema }) as unknown as Db;

  if (!migrationDone) {
    migrationDone = true;
    const migrationsFolder = resolve(process.cwd(), "drizzle");
    migrate(db as any, { migrationsFolder }).catch(() => {});
  }

  prod = db;
  return prod;
}

/** In-memory Postgres for tests, with all migrations applied. */
export async function createTestDb(): Promise<Db> {
  const client = new PGlite();
  const db = drizzlePglite(client, { schema }) as unknown as Db;
  await migrate(db as any, { migrationsFolder: "drizzle" });
  return db;
}

