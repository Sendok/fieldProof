import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://fieldproof:fieldproof@localhost:5432/fieldproof",
  },
  strict: true,
  verbose: true,
});
