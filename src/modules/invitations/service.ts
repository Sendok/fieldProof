import { and, eq, gt } from "drizzle-orm";

import type { OrganizationRole } from "@/modules/memberships/permissions";
import { getDatabase } from "@/server/db/client";
import { auditLogs, invitations, memberships, users } from "@/server/db/schema";
import { sendEmail } from "@/server/email/client";
import { getRuntimeEnv } from "@/server/env";
import { createOpaqueToken, hashToken } from "@/server/security/tokens";

export async function inviteMember(input: { organizationId: string; actorId: string; email: string; role: Exclude<OrganizationRole, "OWNER"> }): Promise<void> {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await getDatabase().transaction(async (tx) => {
    const [invitation] = await tx.insert(invitations).values({ organizationId: input.organizationId, email: input.email, role: input.role, tokenHash: token.hash, invitedById: input.actorId, expiresAt }).returning();
    await tx.insert(auditLogs).values({ organizationId: input.organizationId, actorId: input.actorId, action: "MEMBER_INVITED", resourceType: "INVITATION", resourceId: invitation.id, metadata: { email: input.email, role: input.role } });
  });
  const url = new URL(`/invitation/${token.raw}`, getRuntimeEnv().APP_URL);
  await sendEmail({ to: input.email, subject: "Undangan FieldProof", text: `Anda diundang ke FieldProof: ${url.toString()}` });
}

export async function acceptInvitation(rawToken: string, userId: string): Promise<boolean> {
  const db = getDatabase();
  const invitation = await db.select().from(invitations).where(and(eq(invitations.tokenHash, hashToken(rawToken)), eq(invitations.status, "PENDING"), gt(invitations.expiresAt, new Date()))).limit(1);
  if (!invitation[0]) return false;
  const user = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (user[0]?.email !== invitation[0].email) return false;
  await db.transaction(async (tx) => {
    await tx.insert(memberships).values({ organizationId: invitation[0].organizationId, userId, role: invitation[0].role }).onConflictDoNothing();
    await tx.update(invitations).set({ status: "ACCEPTED", acceptedAt: new Date() }).where(eq(invitations.id, invitation[0].id));
    await tx.insert(auditLogs).values({ organizationId: invitation[0].organizationId, actorId: userId, action: "INVITATION_ACCEPTED", resourceType: "INVITATION", resourceId: invitation[0].id });
  });
  return true;
}

export async function cancelInvitation(organizationId: string, actorId: string, invitationId: string): Promise<boolean> {
  return getDatabase().transaction(async (tx) => {
    const [row] = await tx.update(invitations).set({ status: "CANCELLED" }).where(and(eq(invitations.organizationId, organizationId), eq(invitations.id, invitationId), eq(invitations.status, "PENDING"))).returning({ id: invitations.id, email: invitations.email });
    if (!row) return false;
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "INVITATION_CANCELLED", resourceType: "INVITATION", resourceId: invitationId, metadata: { email: row.email } });
    return true;
  });
}

export async function resendInvitation(organizationId: string, actorId: string, invitationId: string): Promise<boolean> {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [row] = await getDatabase().update(invitations).set({ tokenHash: token.hash, expiresAt }).where(and(eq(invitations.organizationId, organizationId), eq(invitations.id, invitationId), eq(invitations.status, "PENDING"))).returning({ email: invitations.email });
  if (!row) return false;
  const url = new URL(`/invitation/${token.raw}`, getRuntimeEnv().APP_URL);
  await sendEmail({ to: row.email, subject: "Undangan FieldProof dikirim ulang", text: `Undangan baru Anda: ${url.toString()}` });
  await getDatabase().insert(auditLogs).values({ organizationId, actorId, action: "INVITATION_RESENT", resourceType: "INVITATION", resourceId: invitationId, metadata: { email: row.email } });
  return true;
}
