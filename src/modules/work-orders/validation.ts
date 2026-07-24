import { z } from "zod";

const optionalDate = z.preprocess((value) => value === "" || value == null ? undefined : value, z.coerce.date().optional());
const optionalUuid = z.preprocess((value) => value === "" || value == null ? undefined : value, z.uuid().optional());

export const workOrderInputSchema = z.object({
  title: z.string().trim().min(3).max(240),
  description: z.string().trim().max(5_000).optional(),
  clientId: z.uuid(),
  siteId: z.uuid(),
  templateVersionId: z.uuid(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  scheduleStart: optionalDate,
  scheduleEnd: optionalDate,
  dueDate: optionalDate,
  teamId: optionalUuid,
  supervisorMembershipId: optionalUuid,
  internalNotes: z.string().trim().max(5_000).optional(),
  instructions: z.string().trim().max(5_000).optional(),
  tags: z.string().optional().transform((value) => value?.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20) ?? []),
  clientVisibility: z.coerce.boolean().default(false),
  clientApprovalRequired: z.coerce.boolean().default(false),
  recurrenceFrequency: z.preprocess((value) => value === "" || value == null ? undefined : value, z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional()),
  recurrenceInterval: z.coerce.number().int().min(1).max(365).default(1),
  recurrenceEndAt: optionalDate,
  assigneeIds: z.array(z.uuid()).default([]),
}).superRefine((input, context) => {
  if (input.scheduleStart && input.scheduleEnd && input.scheduleEnd <= input.scheduleStart) context.addIssue({ code: "custom", path: ["scheduleEnd"], message: "Schedule end harus setelah schedule start." });
  if (input.recurrenceFrequency && !input.scheduleStart) context.addIssue({ code: "custom", path: ["scheduleStart"], message: "Recurring work order membutuhkan schedule start." });
  if (input.recurrenceEndAt && input.scheduleStart && input.recurrenceEndAt <= input.scheduleStart) context.addIssue({ code: "custom", path: ["recurrenceEndAt"], message: "Recurrence end harus setelah schedule start." });
});

export type WorkOrderInput = z.infer<typeof workOrderInputSchema>;

export const workOrderListSchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "ASSIGNED", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "REVISION_REQUIRED", "APPROVED", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  sort: z.enum(["newest", "oldest", "schedule_asc", "due_asc", "priority"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
});
