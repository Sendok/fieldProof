import { z } from "zod";
import { organizationRole } from "@/server/db/schema";

export const inviteMemberSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  role: z.enum(organizationRole.enumValues).refine((role) => role !== "OWNER", "Ownership cannot be assigned by invitation."),
});
