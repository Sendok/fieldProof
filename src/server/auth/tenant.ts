import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";

import { auth, SESSION_COOKIE_NAME } from "@/server/auth";
import { getDatabase } from "@/server/db/client";
import { memberships, organizations, sessions } from "@/server/db/schema";
import type { OrganizationRole } from "@/modules/memberships/permissions";

export interface TenantContext {
  userId: string;
  organizationId: string;
  membershipId: string;
  role: OrganizationRole;
}

export async function requireTenantContext(): Promise<TenantContext> {
  const session = await auth();
  if (!session?.user.id) throw new Error("UNAUTHORIZED");
  const sessionToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) throw new Error("UNAUTHORIZED");
  const db = getDatabase();
  const active = await db
    .select({ organizationId: sessions.activeOrganizationId })
    .from(sessions)
    .where(and(eq(sessions.userId, session.user.id), eq(sessions.sessionToken, sessionToken), gt(sessions.expires, new Date())))
    .limit(1);
  const organizationId = active[0]?.organizationId;
  if (!organizationId) throw new Error("ORGANIZATION_REQUIRED");
  const membership = await db
    .select({ id: memberships.id, role: memberships.role })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(and(eq(memberships.userId, session.user.id), eq(memberships.organizationId, organizationId), eq(memberships.status, "ACTIVE"), eq(organizations.status, "ACTIVE")))
    .limit(1);
  if (!membership[0]) throw new Error("FORBIDDEN");
  return { userId: session.user.id, organizationId, membershipId: membership[0].id, role: membership[0].role };
}
