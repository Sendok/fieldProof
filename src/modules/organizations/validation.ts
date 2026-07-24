import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(180),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(80),
  industry: z.string().trim().max(100).optional(),
  country: z.string().length(2).default("ID"),
  timezone: z.string().min(1).max(64).default("Asia/Jakarta"),
  locale: z.enum(["id-ID", "en-US"]).default("id-ID"),
});
