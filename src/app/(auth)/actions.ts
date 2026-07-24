"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/modules/auth/validation";
import { authenticateCredentials, registerUser, requestPasswordReset, resetPassword } from "@/modules/auth/service";
import { SESSION_COOKIE_NAME } from "@/server/auth";
import { enforceRateLimit } from "@/server/security/rate-limit";

export async function loginAction(formData: FormData): Promise<void> {
  const input = loginSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect("/login?error=invalid");
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await enforceRateLimit(`login:${forwardedFor}:${input.data.email}`, 8, 15 * 60))) redirect("/login?error=rate-limit");
  let session: Awaited<ReturnType<typeof authenticateCredentials>>;
  try {
    session = await authenticateCredentials({ ...input.data, ipAddress: forwardedFor, userAgent: requestHeaders.get("user-agent") ?? undefined });
  } catch {
    redirect("/login?error=unavailable");
  }
  if (!session) redirect("/login?error=credentials");
  (await cookies()).set(SESSION_COOKIE_NAME, session.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: session.expires });
  redirect("/app/dashboard");
}

export async function registerAction(formData: FormData): Promise<void> {
  const input = registerSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect("/register?error=invalid");
  if (!(await enforceRateLimit(`register:${input.data.email}`, 4, 60 * 60))) redirect("/register?error=rate-limit");
  await registerUser(input.data);
  redirect("/login?registered=1");
}

export async function forgotPasswordAction(formData: FormData): Promise<void> {
  const input = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (input.success && (await enforceRateLimit(`reset:${input.data.email}`, 4, 60 * 60))) await requestPasswordReset(input.data.email);
  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const input = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!input.success || !(await resetPassword(input.data.token, input.data.password))) redirect("/reset-password?error=invalid");
  redirect("/login?reset=1");
}
