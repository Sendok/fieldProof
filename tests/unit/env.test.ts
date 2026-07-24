import { describe, expect, it } from "vitest";

import { parseRuntimeEnv } from "@/server/env";

const validEnv = {
  NODE_ENV: "test",
  APP_URL: "http://localhost:3000",
  AUTH_SECRET: "development-only-secret-at-least-32-characters",
  DATABASE_URL: "postgresql://fieldproof:fieldproof@localhost:5432/fieldproof",
  REDIS_URL: "redis://localhost:6379",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  EMAIL_FROM: "noreply@fieldproof.local",
  S3_ENDPOINT: "http://localhost:9000",
  S3_REGION: "us-east-1",
  S3_BUCKET: "fieldproof",
  S3_ACCESS_KEY_ID: "fieldproof",
  S3_SECRET_ACCESS_KEY: "fieldproof-dev-secret",
  S3_FORCE_PATH_STYLE: "true",
};

describe("runtime environment", () => {
  it("coerces numeric and boolean values", () => {
    const result = parseRuntimeEnv(validEnv);

    expect(result.SMTP_PORT).toBe(1025);
    expect(result.S3_FORCE_PATH_STYLE).toBe(true);
  });

  it("rejects short authentication secrets", () => {
    expect(() => parseRuntimeEnv({ ...validEnv, AUTH_SECRET: "short" })).toThrow();
  });
});
