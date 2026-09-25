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

// Next.js/Turbopack compiles page-route and route-handler code into separate module bundles,
// so a module-scoped `let` here is NOT a true process-wide singleton — each bundle gets its own
// copy, which for the PGlite fallback means two independent embedded-Postgres instances quietly
// diverging on the same on-disk directory (writes through one invisible to reads through the
// other). `globalThis` is the one thing genuinely shared across every bundle in the process, so
// the cache lives there instead — the standard fix for this class of dev-singleton problem.
declare global {
  // eslint-disable-next-line no-var
  var __saakshyaDb: Db | undefined;
  // eslint-disable-next-line no-var
  var __saakshyaDbInit: Promise<Db> | undefined;
}

/**
 * Production database (Neon over HTTP if DATABASE_URL is set, otherwise persistent PGlite).
 * Must be awaited: on the PGlite path, migrations are applied before the handle is handed back,
 * so a cold/empty data directory never serves a query against tables that don't exist yet.
 * The in-flight construction itself is memoized (not just the finished result), so concurrent
 * callers during a cold start await the same PGlite client instead of each opening their own
 * against the same on-disk directory, which PGlite cannot safely do.
 * `dataDir` is an override for tests only; real call sites always use the default.
 */
export async function getDb(opts?: { dataDir?: string }): Promise<Db> {
  if (globalThis.__saakshyaDb) return globalThis.__saakshyaDb;
  if (globalThis.__saakshyaDbInit) return globalThis.__saakshyaDbInit;

  globalThis.__saakshyaDbInit = (async () => {
    if (process.env.DATABASE_URL) {
      const db = drizzleNeon(neon(process.env.DATABASE_URL), { schema }) as unknown as Db;
      globalThis.__saakshyaDb = db;
      return db;
    }

    // Fallback to local persistent PGlite
    const dataDir = opts?.dataDir ?? resolve(process.cwd(), ".data/pglite");
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    const client = new PGlite(dataDir);
    const db = drizzlePglite(client, { schema }) as unknown as Db;

    const migrationsFolder = resolve(process.cwd(), "drizzle");
    await migrate(db as any, { migrationsFolder });

    globalThis.__saakshyaDb = db;
    return db;
  })();

  return globalThis.__saakshyaDbInit;
}

/** In-memory Postgres for tests, with all migrations applied. */
export async function createTestDb(): Promise<Db> {
  const client = new PGlite();
  const db = drizzlePglite(client, { schema }) as unknown as Db;
  await migrate(db as any, { migrationsFolder: "drizzle" });
  return db;
}

