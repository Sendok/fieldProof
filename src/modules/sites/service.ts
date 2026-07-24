import { and, asc, count, eq, ilike, isNull, or } from "drizzle-orm";

import { getDatabase } from "@/server/db/client";
import { auditLogs, clients, sites } from "@/server/db/schema";

type SiteInput = typeof sites.$inferInsert;

export async function listSites(input: { organizationId: string; search?: string; page: number; pageSize: number }) {
  const db = getDatabase();
  const search = input.search?.trim();
  const where = and(eq(sites.organizationId, input.organizationId), isNull(sites.archivedAt), search ? or(ilike(sites.name, `%${search}%`), ilike(sites.code, `%${search}%`), ilike(clients.name, `%${search}%`)) : undefined);
  const [rows, total] = await Promise.all([
    db.select({ id: sites.id, code: sites.code, name: sites.name, address: sites.address, status: sites.status, clientName: clients.name }).from(sites).innerJoin(clients, and(eq(clients.id, sites.clientId), eq(clients.organizationId, input.organizationId))).where(where).orderBy(asc(sites.name)).limit(input.pageSize).offset((input.page - 1) * input.pageSize),
    db.select({ value: count() }).from(sites).innerJoin(clients, eq(clients.id, sites.clientId)).where(where),
  ]);
  return { rows, total: total[0]?.value ?? 0 };
}

export async function getSite(organizationId: string, id: string) {
  const [row] = await getDatabase().select().from(sites).where(siteTenantPredicate(organizationId, id)).limit(1);
  return row ?? null;
}

export function siteTenantPredicate(organizationId: string, id: string) {
  return and(eq(sites.organizationId, organizationId), eq(sites.id, id), isNull(sites.archivedAt));
}

export async function createSite(organizationId: string, actorId: string, input: Omit<SiteInput, "organizationId" | "createdById">) {
  return getDatabase().transaction(async (tx) => {
    const [client] = await tx.select({ id: clients.id }).from(clients).where(and(eq(clients.organizationId, organizationId), eq(clients.id, input.clientId), isNull(clients.archivedAt))).limit(1);
    if (!client) throw new Error("CLIENT_NOT_FOUND");
    const [row] = await tx.insert(sites).values({ ...input, organizationId, createdById: actorId }).returning();
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "SITE_CREATED", resourceType: "SITE", resourceId: row.id, afterSummary: { code: row.code, name: row.name, clientId: row.clientId } });
    return row;
  });
}

export async function updateSite(organizationId: string, actorId: string, id: string, input: Omit<SiteInput, "organizationId" | "createdById">) {
  return getDatabase().transaction(async (tx) => {
    const [client] = await tx.select({ id: clients.id }).from(clients).where(and(eq(clients.organizationId, organizationId), eq(clients.id, input.clientId), isNull(clients.archivedAt))).limit(1);
    if (!client) throw new Error("CLIENT_NOT_FOUND");
    const [before] = await tx.select().from(sites).where(and(eq(sites.organizationId, organizationId), eq(sites.id, id), isNull(sites.archivedAt))).limit(1);
    if (!before) return null;
    const [row] = await tx.update(sites).set({ ...input, updatedAt: new Date() }).where(and(eq(sites.organizationId, organizationId), eq(sites.id, id))).returning();
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "SITE_UPDATED", resourceType: "SITE", resourceId: id, beforeSummary: { code: before.code, name: before.name }, afterSummary: { code: row.code, name: row.name } });
    return row;
  });
}

export async function archiveSite(organizationId: string, actorId: string, id: string): Promise<boolean> {
  return getDatabase().transaction(async (tx) => {
    const [row] = await tx.update(sites).set({ archivedAt: new Date(), status: "INACTIVE", updatedAt: new Date() }).where(and(eq(sites.organizationId, organizationId), eq(sites.id, id), isNull(sites.archivedAt))).returning({ id: sites.id, name: sites.name });
    if (!row) return false;
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "SITE_ARCHIVED", resourceType: "SITE", resourceId: id, beforeSummary: { name: row.name }, afterSummary: { archived: true } });
    return true;
  });
}
