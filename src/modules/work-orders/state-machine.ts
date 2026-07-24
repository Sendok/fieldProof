export const workOrderStatuses = ["DRAFT", "SCHEDULED", "ASSIGNED", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "REVISION_REQUIRED", "APPROVED", "COMPLETED", "CANCELLED"] as const;
export type WorkOrderStatus = (typeof workOrderStatuses)[number];

const transitions: Record<WorkOrderStatus, ReadonlySet<WorkOrderStatus>> = {
  DRAFT: new Set(["SCHEDULED", "ASSIGNED", "CANCELLED"]),
  SCHEDULED: new Set(["DRAFT", "ASSIGNED", "CANCELLED"]),
  ASSIGNED: new Set(["DRAFT", "SCHEDULED", "IN_PROGRESS", "CANCELLED"]),
  IN_PROGRESS: new Set(["SUBMITTED", "CANCELLED"]),
  SUBMITTED: new Set(["UNDER_REVIEW"]),
  UNDER_REVIEW: new Set(["REVISION_REQUIRED", "APPROVED"]),
  REVISION_REQUIRED: new Set(["IN_PROGRESS", "SUBMITTED"]),
  APPROVED: new Set(["COMPLETED"]),
  COMPLETED: new Set(),
  CANCELLED: new Set(),
};

export class InvalidWorkOrderTransitionError extends Error {}

export function canTransitionWorkOrder(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return transitions[from].has(to);
}

export function assertWorkOrderTransition(from: WorkOrderStatus, to: WorkOrderStatus, reason?: string): void {
  if (!canTransitionWorkOrder(from, to)) throw new InvalidWorkOrderTransitionError(`Transisi ${from} ke ${to} tidak diizinkan.`);
  if (to === "CANCELLED" && !reason?.trim()) throw new InvalidWorkOrderTransitionError("Pembatalan wajib memiliki alasan.");
}

export function derivePlanningStatus(input: { hasSchedule: boolean; assigneeCount: number }): WorkOrderStatus {
  if (input.assigneeCount > 0) return "ASSIGNED";
  return input.hasSchedule ? "SCHEDULED" : "DRAFT";
}

export function nextOccurrence(from: Date, frequency: "DAILY" | "WEEKLY" | "MONTHLY", interval = 1): Date {
  const next = new Date(from);
  if (frequency === "DAILY") next.setUTCDate(next.getUTCDate() + interval);
  if (frequency === "WEEKLY") next.setUTCDate(next.getUTCDate() + 7 * interval);
  if (frequency === "MONTHLY") {
    const day = next.getUTCDate();
    next.setUTCDate(1);
    next.setUTCMonth(next.getUTCMonth() + interval);
    const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
    next.setUTCDate(Math.min(day, lastDay));
  }
  return next;
}
