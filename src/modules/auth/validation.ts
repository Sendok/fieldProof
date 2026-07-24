import { z } from "zod";

import { PASSWORD_MIN_LENGTH } from "@/server/security/password";

export const loginSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(128),
  invitationToken: z.string().min(32).optional().or(z.literal("")),
});

export const forgotPasswordSchema = z.object({ email: z.email().transform((value) => value.trim().toLowerCase()) });
export const resetPasswordSchema = z.object({ token: z.string().min(32), password: z.string().min(PASSWORD_MIN_LENGTH).max(128) });
