import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "../db/schema";

// Mirror Next.js's own env precedence — see drizzle.config.ts for why.
config({ path: ".env" });
config({ path: ".env.local", override: true });

const client = createClient({ url: `file:${process.env.DATABASE_URL || "./sqlite.db"}` });
void client.execute("PRAGMA foreign_keys = ON");
const db = drizzle(client, { schema });

const main = async () => {
  try {
    console.log("Resetting the database");

    await db.delete(schema.courses);
    await db.delete(schema.userProgress);
    await db.delete(schema.units);
    await db.delete(schema.lessons);
    await db.delete(schema.challenges);
    await db.delete(schema.challengeOptions);
    await db.delete(schema.challengeProgress);
    await db.delete(schema.userSubscription);

    console.log("Resetting finished");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to reset the database");
  }
};

main();

