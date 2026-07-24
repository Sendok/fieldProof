import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getRuntimeEnv } from "@/server/env";

const globalDatabase = globalThis as typeof globalThis & {
  fieldProofPool?: Pool;
};

export function getPool(): Pool {
  if (!globalDatabase.fieldProofPool) {
    globalDatabase.fieldProofPool = new Pool({
      connectionString: getRuntimeEnv().DATABASE_URL,
      max: process.env.NODE_ENV === "production" ? 20 : 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  return globalDatabase.fieldProofPool;
}

export function getDatabase() {
  return drizzle(getPool());
}
