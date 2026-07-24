import { z } from "zod";

export const clientInputSchema = z.object({
  code: z.string().trim().toUpperCase().min(2).max(40).regex(/^[A-Z0-9-]+$/),
  name: z.string().trim().min(2).max(180),
  contactPerson: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.union([z.email(), z.literal("")]).optional(),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  billingAddress: z.string().trim().max(1000).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});
