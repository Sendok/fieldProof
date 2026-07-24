import { eq } from "drizzle-orm";

import { getDatabase } from "@/server/db/client";
import { auditLogs, organizations, organizationSettings } from "@/server/db/schema";

export async function updateOrganizationSettings(organizationId: string, actorId: string, input: { name: string; industry?: string; country: string; timezone: string; locale: "id-ID" | "en-US"; gpsEnabled: boolean; clientApprovalEnabled: boolean; dataRetentionDays: number }) {
  return getDatabase().transaction(async (tx) => {
    const [before] = await tx.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
    if (!before) return null;
    const [organization] = await tx.update(organizations).set({ name: input.name, industry: input.industry, country: input.country, timezone: input.timezone, locale: input.locale, updatedAt: new Date() }).where(eq(organizations.id, organizationId)).returning();
    await tx.insert(organizationSettings).values({ organizationId, gpsEnabled: input.gpsEnabled, clientApprovalEnabled: input.clientApprovalEnabled, dataRetentionDays: String(input.dataRetentionDays) }).onConflictDoUpdate({ target: organizationSettings.organizationId, set: { gpsEnabled: input.gpsEnabled, clientApprovalEnabled: input.clientApprovalEnabled, dataRetentionDays: String(input.dataRetentionDays), updatedAt: new Date() } });
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "ORGANIZATION_SETTINGS_CHANGED", resourceType: "ORGANIZATION", resourceId: organizationId, beforeSummary: { name: before.name, timezone: before.timezone, locale: before.locale }, afterSummary: { name: organization.name, timezone: organization.timezone, locale: organization.locale, gpsEnabled: input.gpsEnabled } });
    return organization;
  });
}
