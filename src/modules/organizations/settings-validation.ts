import { z } from "zod";

export const organizationSettingsSchema = z.object({
  name: z.string().trim().min(2).max(180),
  industry: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().length(2),
  timezone: z.string().trim().min(1).max(64),
  locale: z.enum(["id-ID", "en-US"]),
  gpsEnabled: z.preprocess((value) => value === "on" || value === true, z.boolean()),
  clientApprovalEnabled: z.preprocess((value) => value === "on" || value === true, z.boolean()),
  dataRetentionDays: z.coerce.number().int().min(30).max(3650),
});
