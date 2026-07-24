import { Queue } from "bullmq";
import { createRedisConnection } from "./connection";
import { logger } from "@/server/observability/logger";

const globalQueue = globalThis as typeof globalThis & { fieldProofQueue?: Queue };

export function getFieldProofQueue(): Queue {
  globalQueue.fieldProofQueue ??= new Queue("fieldproof", { connection: createRedisConnection(), defaultJobOptions: { removeOnComplete: 1_000, removeOnFail: 5_000, attempts: 5, backoff: { type: "exponential", delay: 5_000 } } });
  return globalQueue.fieldProofQueue;
}

export async function enqueueNotificationEmail(notificationId: string): Promise<void> {
  await getFieldProofQueue().add("notification-email", { notificationId }, { jobId: `notification-email-${notificationId}` });
}

export async function enqueueRecurringWorkOrder(input: { workOrderId: string; seriesId: string; occurrenceAt: Date }): Promise<void> {
  const delay = Math.max(0, input.occurrenceAt.getTime() - Date.now() - 24 * 60 * 60 * 1_000);
  await getFieldProofQueue().add("recurring-work-order", { workOrderId: input.workOrderId, seriesId: input.seriesId, occurrenceAt: input.occurrenceAt.toISOString() }, { jobId: `recurrence-${input.seriesId}-${input.occurrenceAt.toISOString()}`, delay });
}

export async function safelyEnqueue(operation: () => Promise<void>, context: Record<string, unknown>): Promise<void> {
  try { await operation(); } catch (error) { logger.error("Background job enqueue failed", { ...context, error: error instanceof Error ? error.message : "Unknown error" }); }
}
