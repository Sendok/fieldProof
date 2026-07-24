import { Worker } from "bullmq";

import { createRedisConnection } from "../src/server/queue/connection";
import { logger } from "../src/server/observability/logger";
import { deliverNotificationEmail } from "../src/modules/notifications/service";
import { createDueSoonNotifications, generateRecurringWorkOrder } from "../src/modules/work-orders/service";
import { getFieldProofQueue } from "../src/server/queue/jobs";

const connection = createRedisConnection();

const worker = new Worker(
  "fieldproof",
  async (job) => {
    logger.info("Background job received", { jobId: job.id, jobName: job.name });
    if (job.name === "notification-email") return deliverNotificationEmail(String(job.data.notificationId));
    if (job.name === "recurring-work-order") return generateRecurringWorkOrder(String(job.data.workOrderId), new Date(String(job.data.occurrenceAt)));
    if (job.name === "work-order-due-reminders") return createDueSoonNotifications();
  },
  { connection, concurrency: 5 },
);

worker.on("completed", (job) => logger.info("Background job completed", { jobId: job.id }));
worker.on("failed", (job, error) => {
  logger.error("Background job failed", { jobId: job?.id, error: error.message });
});

async function shutdown(signal: string): Promise<void> {
  logger.info("Worker shutting down", { signal });
  await worker.close();
  await getFieldProofQueue().close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

logger.info("FieldProof worker started");

await getFieldProofQueue().upsertJobScheduler("work-order-due-reminders-hourly", { pattern: "0 * * * *" }, { name: "work-order-due-reminders", data: {} });
