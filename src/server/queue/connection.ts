import IORedis from "ioredis";

import { getRuntimeEnv } from "@/server/env";

export function createRedisConnection(): IORedis {
  const connection = new IORedis(getRuntimeEnv().REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
  });
  // ioredis emits an `error` event in addition to rejecting commands.
  // Registering a listener prevents process-level unhandled events; callers still handle rejections.
  connection.on("error", () => undefined);
  return connection;
}
