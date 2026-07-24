import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { builtInTemplates } from "@/modules/templates/built-ins";
import { getDatabase } from "@/server/db/client";
import { auditLogs, checklistTemplates, checklistTemplateVersions, memberships, organizations, organizationSettings, sessions } from "@/server/db/schema";

export async function createOrganization(userId: string, sessionToken: string, input: { name: string; slug: string; industry?: string; country: string; timezone: string; locale: "id-ID" | "en-US" }) {
  return getDatabase().transaction(async (tx) => {
    const [organization] = await tx.insert(organizations).values(input).returning();
    await tx.insert(organizationSettings).values({ organizationId: organization.id });
    await tx.insert(memberships).values({ organizationId: organization.id, userId, role: "OWNER" });
    for (const builtIn of builtInTemplates) {
      const [template] = await tx.insert(checklistTemplates).values({ organizationId: organization.id, createdById: userId, name: builtIn.name, description: builtIn.description, industry: builtIn.industry, category: builtIn.category, estimatedMinutes: builtIn.estimatedMinutes, isBuiltIn: true, status: "PUBLISHED", currentVersion: 1, draftSchema: builtIn.schema }).returning({ id: checklistTemplates.id });
      await tx.insert(checklistTemplateVersions).values({ organizationId: organization.id, templateId: template.id, version: 1, schemaSnapshot: builtIn.schema, createdById: userId });
    }
    await tx.update(sessions).set({ activeOrganizationId: organization.id }).where(and(eq(sessions.userId, userId), eq(sessions.sessionToken, sessionToken)));
    await tx.insert(auditLogs).values({ organizationId: organization.id, actorId: userId, action: "ORGANIZATION_CREATED", resourceType: "ORGANIZATION", resourceId: organization.id, afterSummary: { name: organization.name, slug: organization.slug } });
    return organization;
  });
}

export async function switchOrganization(userId: string, sessionToken: string, organizationId: string): Promise<boolean> {
  const db = getDatabase();
  const allowed = await db.select({ id: memberships.id }).from(memberships).where(and(eq(memberships.userId, userId), eq(memberships.organizationId, organizationId), eq(memberships.status, "ACTIVE"))).limit(1);
  if (!allowed[0]) return false;
  await db.update(sessions).set({ activeOrganizationId: organizationId }).where(and(eq(sessions.userId, userId), eq(sessions.sessionToken, sessionToken)));
  return true;
}

export async function getOrganizationForTenant(tenantOrganizationId: string, requestedId: string) {
  return findOrganizationByIdForTenant(getDatabase(), tenantOrganizationId, requestedId);
}

export async function findOrganizationByIdForTenant(
  db: NodePgDatabase,
  tenantOrganizationId: string,
  requestedId: string,
) {
  const result = await db.select().from(organizations).where(organizationTenantPredicate(tenantOrganizationId, requestedId)).limit(1);
  return result[0] ?? null;
}

export function organizationTenantPredicate(tenantOrganizationId: string, requestedId: string) {
  return and(eq(organizations.id, requestedId), eq(organizations.id, tenantOrganizationId));
}
