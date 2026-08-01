import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// Mirror Next.js's own env precedence: .env as the base, .env.local
// overriding it. Plain `import "dotenv/config"` only ever reads .env, which
// silently misses DATABASE_URL when it's kept in .env.local as recommended.
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "./sqlite.db",
  },
} satisfies Config;
