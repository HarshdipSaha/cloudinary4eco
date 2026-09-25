import * as schema from "./schema";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";

export type Db = PgDatabase<any, typeof schema>;

let prod: Db | null = null;
/** Production database (Neon over HTTP). No connection is opened until the first query. */
export function getDb(): Db {
  prod ??= drizzleNeon(neon(process.env.DATABASE_URL!), { schema }) as unknown as Db;
  return prod;
}

/** In-memory Postgres for tests, with all migrations applied. */
export async function createTestDb(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  return db as unknown as Db;
}
