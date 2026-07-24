import { and, asc, count, eq, ilike, isNull, or } from "drizzle-orm";

import { getDatabase } from "@/server/db/client";
import { auditLogs, clientReviewers, clients, memberships } from "@/server/db/schema";

type ClientInput = {
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  notes?: string;
  status: "ACTIVE" | "INACTIVE";
};

export async function listClients(input: { organizationId: string; search?: string; status?: "ACTIVE" | "INACTIVE"; page: number; pageSize: number }) {
  const db = getDatabase();
  const search = input.search?.trim();
  const where = and(
    eq(clients.organizationId, input.organizationId),
    isNull(clients.archivedAt),
    input.status ? eq(clients.status, input.status) : undefined,
    search ? or(ilike(clients.name, `%${search}%`), ilike(clients.code, `%${search}%`), ilike(clients.contactPerson, `%${search}%`)) : undefined,
  );
  const [rows, total] = await Promise.all([
    db.select().from(clients).where(where).orderBy(asc(clients.name)).limit(input.pageSize).offset((input.page - 1) * input.pageSize),
    db.select({ value: count() }).from(clients).where(where),
  ]);
  return { rows, total: total[0]?.value ?? 0 };
}

export async function getClient(organizationId: string, id: string) {
  const [row] = await getDatabase().select().from(clients).where(clientTenantPredicate(organizationId, id)).limit(1);
  return row ?? null;
}

export function clientTenantPredicate(organizationId: string, id: string) {
  return and(eq(clients.organizationId, organizationId), eq(clients.id, id), isNull(clients.archivedAt));
}

export async function createClient(organizationId: string, actorId: string, input: ClientInput) {
  return getDatabase().transaction(async (tx) => {
    const [row] = await tx.insert(clients).values({ organizationId, createdById: actorId, ...input }).returning();
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "CLIENT_CREATED", resourceType: "CLIENT", resourceId: row.id, afterSummary: { code: row.code, name: row.name, status: row.status } });
    return row;
  });
}

export async function updateClient(organizationId: string, actorId: string, id: string, input: ClientInput) {
  return getDatabase().transaction(async (tx) => {
    const [before] = await tx.select().from(clients).where(and(eq(clients.organizationId, organizationId), eq(clients.id, id), isNull(clients.archivedAt))).limit(1);
    if (!before) return null;
    const [row] = await tx.update(clients).set({ ...input, updatedAt: new Date() }).where(and(eq(clients.organizationId, organizationId), eq(clients.id, id))).returning();
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "CLIENT_UPDATED", resourceType: "CLIENT", resourceId: id, beforeSummary: { code: before.code, name: before.name, status: before.status }, afterSummary: { code: row.code, name: row.name, status: row.status } });
    return row;
  });
}

export async function archiveClient(organizationId: string, actorId: string, id: string): Promise<boolean> {
  return getDatabase().transaction(async (tx) => {
    const [row] = await tx.update(clients).set({ archivedAt: new Date(), status: "INACTIVE", updatedAt: new Date() }).where(and(eq(clients.organizationId, organizationId), eq(clients.id, id), isNull(clients.archivedAt))).returning({ id: clients.id, name: clients.name });
    if (!row) return false;
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "CLIENT_ARCHIVED", resourceType: "CLIENT", resourceId: id, beforeSummary: { name: row.name }, afterSummary: { archived: true } });
    return true;
  });
}

export async function setClientReviewer(organizationId: string, actorId: string, clientId: string, membershipId: string, assigned: boolean): Promise<boolean> {
  return getDatabase().transaction(async (tx) => {
    const [client] = await tx.select({ id: clients.id }).from(clients).where(clientTenantPredicate(organizationId, clientId)).limit(1);
    const [membership] = await tx.select({ id: memberships.id }).from(memberships).where(and(eq(memberships.organizationId, organizationId), eq(memberships.id, membershipId), eq(memberships.role, "CLIENT_REVIEWER"), eq(memberships.status, "ACTIVE"))).limit(1);
    if (!client || !membership) return false;
    if (assigned) await tx.insert(clientReviewers).values({ clientId, membershipId }).onConflictDoNothing();
    else await tx.delete(clientReviewers).where(and(eq(clientReviewers.clientId, clientId), eq(clientReviewers.membershipId, membershipId)));
    await tx.insert(auditLogs).values({ organizationId, actorId, action: assigned ? "CLIENT_REVIEWER_ASSIGNED" : "CLIENT_REVIEWER_REMOVED", resourceType: "CLIENT", resourceId: clientId, metadata: { membershipId } });
    return true;
  });
}
