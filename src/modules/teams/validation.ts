import { z } from "zod";

export const teamInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  area: z.string().trim().max(160).optional().or(z.literal("")),
  supervisorMembershipId: z.union([z.uuid(), z.literal("")]).optional(),
  memberIds: z.array(z.uuid()).default([]).transform((ids) => [...new Set(ids)]),
});
