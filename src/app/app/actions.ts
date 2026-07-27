"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { inviteMember } from "@/modules/invitations/service";
import { inviteMemberSchema } from "@/modules/invitations/validation";
import { assertPermission } from "@/modules/memberships/permissions";
import { createOrganization, switchOrganization } from "@/modules/organizations/service";
import { createOrganizationSchema } from "@/modules/organizations/validation";
import { auth, SESSION_COOKIE_NAME } from "@/server/auth";
import { requireTenantContext } from "@/server/auth/tenant";
import { getDatabase } from "@/server/db/client";
import { sessions } from "@/server/db/schema";

export async function createOrganizationAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user.id) redirect("/login");
  const input = createOrganizationSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect("/app/onboarding?error=invalid");
  const sessionToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) redirect("/login");
  await createOrganization(session.user.id, sessionToken, input.data);
  redirect("/app/dashboard");
}

export async function switchOrganizationAction(formData: FormData): Promise<void> {
  const session = await auth();
  const organizationId = formData.get("organizationId");
  const sessionToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!session?.user.id || !sessionToken || typeof organizationId !== "string" || !(await switchOrganization(session.user.id, sessionToken, organizationId))) throw new Error("FORBIDDEN");
  revalidatePath("/app", "layout");
}

export async function inviteMemberAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext();
  assertPermission(tenant.role, "membership:manage");
  const input = inviteMemberSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) throw new Error("INVALID_INVITATION");
  await inviteMember({ organizationId: tenant.organizationId, actorId: tenant.userId, email: input.data.email, role: input.data.role });
  revalidatePath("/app/members");
}

export async function revokeSessionAction(formData: FormData): Promise<void> {
  const authSession = await auth();
  const sessionId = formData.get("sessionId");
  if (!authSession?.user.id || typeof sessionId !== "string") throw new Error("UNAUTHORIZED");
  await getDatabase().delete(sessions).where(and(eq(sessions.id, sessionId), eq(sessions.userId, authSession.user.id)));
  revalidatePath("/app/settings/security");
}

export async function logoutAllAction(): Promise<void> {
  const authSession = await auth();
  if (authSession?.user.id) await getDatabase().delete(sessions).where(eq(sessions.userId, authSession.user.id));
  (await cookies()).delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

export async function logoutAction(): Promise<void> {
  const authSession = await auth();
  const sessionToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (authSession?.user.id && sessionToken) {
    await getDatabase().delete(sessions).where(and(eq(sessions.userId, authSession.user.id), eq(sessions.sessionToken, sessionToken)));
  }
  (await cookies()).delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
