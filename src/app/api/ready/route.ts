import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDatabase } from "@/server/db/client";
import { createRedisConnection } from "@/server/queue/connection";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const redis = createRedisConnection();

  try {
    await Promise.all([
      getDatabase().execute(sql`select 1`),
      redis.connect().then(() => redis.ping()),
    ]);

    return NextResponse.json({ status: "ready", database: "ok", redis: "ok" });
  } catch {
    return NextResponse.json(
      { status: "not_ready", message: "One or more required services are unavailable." },
      { status: 503 },
    );
  } finally {
    redis.disconnect();
  }
}
