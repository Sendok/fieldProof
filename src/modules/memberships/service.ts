import { and, eq } from "drizzle-orm";

import type { OrganizationRole } from "@/modules/memberships/permissions";
import { getDatabase } from "@/server/db/client";
import { auditLogs, memberships, users } from "@/server/db/schema";

export async function updateMemberRole(organizationId: string, actorId: string, membershipId: string, role: Exclude<OrganizationRole, "OWNER">): Promise<boolean> {
  return getDatabase().transaction(async (tx) => {
    const [before] = await tx.select().from(memberships).where(and(eq(memberships.organizationId, organizationId), eq(memberships.id, membershipId))).limit(1);
    if (!before || before.role === "OWNER") return false;
    await tx.update(memberships).set({ role, updatedAt: new Date() }).where(eq(memberships.id, membershipId));
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "MEMBER_ROLE_CHANGED", resourceType: "MEMBERSHIP", resourceId: membershipId, beforeSummary: { role: before.role }, afterSummary: { role } });
    return true;
  });
}

export async function setMemberSuspended(organizationId: string, actorId: string, membershipId: string, suspended: boolean): Promise<boolean> {
  return getDatabase().transaction(async (tx) => {
    const [before] = await tx.select().from(memberships).where(and(eq(memberships.organizationId, organizationId), eq(memberships.id, membershipId))).limit(1);
    if (!before || before.role === "OWNER" || before.userId === actorId) return false;
    const status = suspended ? "SUSPENDED" : "ACTIVE";
    await tx.update(memberships).set({ status, updatedAt: new Date() }).where(eq(memberships.id, membershipId));
    await tx.insert(auditLogs).values({ organizationId, actorId, action: suspended ? "MEMBER_SUSPENDED" : "MEMBER_REACTIVATED", resourceType: "MEMBERSHIP", resourceId: membershipId, beforeSummary: { status: before.status }, afterSummary: { status } });
    return true;
  });
}

export async function transferOwnership(organizationId: string, actorId: string, targetMembershipId: string): Promise<boolean> {
  return getDatabase().transaction(async (tx) => {
    const [current] = await tx.select().from(memberships).where(and(eq(memberships.organizationId, organizationId), eq(memberships.userId, actorId), eq(memberships.role, "OWNER"))).limit(1);
    const [target] = await tx.select().from(memberships).where(and(eq(memberships.organizationId, organizationId), eq(memberships.id, targetMembershipId), eq(memberships.status, "ACTIVE"))).limit(1);
    if (!current || !target || target.role === "OWNER") return false;
    await tx.update(memberships).set({ role: "ADMIN", updatedAt: new Date() }).where(eq(memberships.id, current.id));
    await tx.update(memberships).set({ role: "OWNER", updatedAt: new Date() }).where(eq(memberships.id, target.id));
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "OWNERSHIP_TRANSFERRED", resourceType: "MEMBERSHIP", resourceId: target.id, beforeSummary: { ownerMembershipId: current.id }, afterSummary: { ownerMembershipId: target.id, ownerUserId: target.userId } });
    return true;
  });
}

export async function listOrganizationMembers(organizationId: string) {
  return getDatabase().select({ id: memberships.id, userId: memberships.userId, name: users.name, email: users.email, role: memberships.role, status: memberships.status, createdAt: memberships.createdAt }).from(memberships).innerJoin(users, eq(users.id, memberships.userId)).where(eq(memberships.organizationId, organizationId));
}
