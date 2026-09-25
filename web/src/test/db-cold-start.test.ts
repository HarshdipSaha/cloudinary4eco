import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as t from "@/ledger/schema";

describe("getDb PGlite cold start", () => {
  let dir: string | null = null;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = null;
  });

  it("never serves a query before migrations finish on a fresh data directory", async () => {
    dir = mkdtempSync(join(tmpdir(), "saakshya-db-race-"));
    const { getDb } = await import("@/ledger/db");
    const db = await getDb({ dataDir: dir });
    // If getDb() resolved before migrations actually finished, this throws
    // "relation \"projects\" does not exist" instead of returning [].
    await expect(db.select().from(t.projects)).resolves.toEqual([]);
  });
});
