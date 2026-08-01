import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

const client = createClient({
  url: `file:${process.env.DATABASE_URL || "./sqlite.db"}`,
});

// Off by default in SQLite — without this, the onDelete: "cascade"/"set null"
// behavior declared throughout schema.ts is silently not enforced. Not
// top-level-awaited (avoids bumping the tsconfig target for one call) — safe
// because the client processes execute() calls in invocation order, so this
// always lands before any query the rest of the app issues.
void client.execute("PRAGMA foreign_keys = ON");

const db = drizzle(client, { schema });

export default db;
