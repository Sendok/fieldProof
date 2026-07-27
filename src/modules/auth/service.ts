import { and, eq, gt, isNull } from "drizzle-orm";

import { memberships, passwordResetTokens, sessions, users, verificationTokens } from "@/server/db/schema";
import { getDatabase } from "@/server/db/client";
import { sendEmail } from "@/server/email/client";
import { getRuntimeEnv } from "@/server/env";
import { hashPassword } from "@/server/security/password";
import { verifyPassword } from "@/server/security/password";
import { createOpaqueToken, hashToken } from "@/server/security/tokens";

export async function registerUser(input: { name: string; email: string; password: string; invitationToken?: string }): Promise<void> {
  const db = getDatabase();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing.length > 0) return;

  const passwordHash = await hashPassword(input.password);
  const token = createOpaqueToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    await tx.insert(users).values({ name: input.name, email: input.email, passwordHash });
    await tx.insert(verificationTokens).values({ identifier: input.email, token: token.hash, expires });
  });

  const url = new URL("/verify-email", getRuntimeEnv().APP_URL);
  url.searchParams.set("email", input.email);
  url.searchParams.set("token", token.raw);
  if (input.invitationToken) url.searchParams.set("invitation", input.invitationToken);
  await sendEmail({ to: input.email, subject: "Verifikasi email FieldProof", text: `Verifikasi akun FieldProof Anda: ${url.toString()}` });
}

export async function verifyEmail(email: string, rawToken: string): Promise<boolean> {
  const db = getDatabase();
  const tokenHash = hashToken(rawToken);
  const match = await db.select().from(verificationTokens).where(and(eq(verificationTokens.identifier, email), eq(verificationTokens.token, tokenHash), gt(verificationTokens.expires, new Date()))).limit(1);
  if (!match[0]) return false;
  await db.transaction(async (tx) => {
    await tx.update(users).set({ emailVerified: new Date(), updatedAt: new Date() }).where(eq(users.email, email));
    await tx.delete(verificationTokens).where(and(eq(verificationTokens.identifier, email), eq(verificationTokens.token, tokenHash)));
  });
  return true;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const db = getDatabase();
  const user = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!user[0]) return;
  const token = createOpaqueToken();
  await db.insert(passwordResetTokens).values({ userId: user[0].id, tokenHash: token.hash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
  const url = new URL("/reset-password", getRuntimeEnv().APP_URL);
  url.searchParams.set("token", token.raw);
  await sendEmail({ to: email, subject: "Reset password FieldProof", text: `Atur ulang password Anda: ${url.toString()}` });
}

export async function resetPassword(rawToken: string, password: string): Promise<boolean> {
  const db = getDatabase();
  const tokenHash = hashToken(rawToken);
  const record = await db.select().from(passwordResetTokens).where(and(eq(passwordResetTokens.tokenHash, tokenHash), gt(passwordResetTokens.expiresAt, new Date()), isNull(passwordResetTokens.usedAt))).limit(1);
  if (!record[0]) return false;
  const passwordHash = await hashPassword(password);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, record[0].userId));
    await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, record[0].id));
  });
  return true;
}

export async function authenticateCredentials(input: { email: string; password: string; ipAddress?: string; userAgent?: string }) {
  const db = getDatabase();
  const result = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  const user = result[0];
  if (!user?.passwordHash || !user.emailVerified || !(await verifyPassword(user.passwordHash, input.password))) return null;
  const token = createOpaqueToken().raw;
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const membership = await db.select({ organizationId: memberships.organizationId, role: memberships.role }).from(memberships).where(and(eq(memberships.userId, user.id), eq(memberships.status, "ACTIVE"))).limit(1);
  await db.insert(sessions).values({ sessionToken: token, userId: user.id, expires, activeOrganizationId: membership[0]?.organizationId, ipAddress: input.ipAddress, userAgent: input.userAgent });
  return { token, expires, role: membership[0]?.role ?? null };
}
