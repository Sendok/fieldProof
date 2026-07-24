import { and, asc, count, eq, ilike, isNull, or } from "drizzle-orm";

import { auditLogs, checklistTemplates, checklistTemplateVersions } from "@/server/db/schema";
import { getDatabase } from "@/server/db/client";
import { checklistSchema, emptyChecklistSchema, type ChecklistSchema } from "./validation";

export class TemplateConflictError extends Error {}

export function templateTenantPredicate(organizationId: string, id: string) {
  return and(eq(checklistTemplates.organizationId, organizationId), eq(checklistTemplates.id, id), isNull(checklistTemplates.archivedAt));
}

export async function listTemplates(input: { organizationId: string; search?: string; page: number; pageSize: number }) {
  const search = input.search?.trim();
  const where = and(eq(checklistTemplates.organizationId, input.organizationId), isNull(checklistTemplates.archivedAt), search ? or(ilike(checklistTemplates.name, `%${search}%`), ilike(checklistTemplates.category, `%${search}%`), ilike(checklistTemplates.industry, `%${search}%`)) : undefined);
  const db = getDatabase();
  const [rows, total] = await Promise.all([
    db.select().from(checklistTemplates).where(where).orderBy(asc(checklistTemplates.name)).limit(input.pageSize).offset((input.page - 1) * input.pageSize),
    db.select({ value: count() }).from(checklistTemplates).where(where),
  ]);
  return { rows, total: total[0]?.value ?? 0 };
}

export async function getTemplate(organizationId: string, id: string) {
  const [row] = await getDatabase().select().from(checklistTemplates).where(templateTenantPredicate(organizationId, id)).limit(1);
  return row ? { ...row, draftSchema: checklistSchema.parse(row.draftSchema) } : null;
}

export async function listTemplateVersions(organizationId: string, templateId: string) {
  return getDatabase().select().from(checklistTemplateVersions).where(and(eq(checklistTemplateVersions.organizationId, organizationId), eq(checklistTemplateVersions.templateId, templateId))).orderBy(asc(checklistTemplateVersions.version));
}

export async function getTemplateVersion(organizationId: string, templateId: string, version: number) {
  const [row] = await getDatabase().select().from(checklistTemplateVersions).where(and(eq(checklistTemplateVersions.organizationId, organizationId), eq(checklistTemplateVersions.templateId, templateId), eq(checklistTemplateVersions.version, version))).limit(1);
  return row ? { ...row, schemaSnapshot: checklistSchema.parse(row.schemaSnapshot) } : null;
}

export async function createTemplate(organizationId: string, actorId: string, input: { name: string; description?: string; industry?: string; category?: string; estimatedMinutes?: number; schema?: ChecklistSchema }) {
  return getDatabase().transaction(async (tx) => {
    const [row] = await tx.insert(checklistTemplates).values({ organizationId, createdById: actorId, ...input, draftSchema: input.schema ?? emptyChecklistSchema() }).returning();
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "TEMPLATE_CREATED", resourceType: "CHECKLIST_TEMPLATE", resourceId: row.id, afterSummary: { name: row.name, status: row.status } });
    return row;
  });
}

export async function saveTemplateDraft(organizationId: string, actorId: string, id: string, expectedRowVersion: number, input: { name: string; description?: string; industry?: string; category?: string; estimatedMinutes?: number; schema: ChecklistSchema }) {
  const parsedSchema = checklistSchema.parse(input.schema);
  return getDatabase().transaction(async (tx) => {
    const [row] = await tx.update(checklistTemplates).set({ ...input, draftSchema: parsedSchema, rowVersion: expectedRowVersion + 1, updatedAt: new Date() }).where(and(templateTenantPredicate(organizationId, id), eq(checklistTemplates.rowVersion, expectedRowVersion))).returning();
    if (!row) throw new TemplateConflictError("Template berubah di sesi lain. Muat ulang builder sebelum menyimpan lagi.");
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "TEMPLATE_DRAFT_SAVED", resourceType: "CHECKLIST_TEMPLATE", resourceId: id, afterSummary: { name: row.name, rowVersion: row.rowVersion } });
    return row;
  });
}

export async function publishTemplate(organizationId: string, actorId: string, id: string, expectedRowVersion: number) {
  return getDatabase().transaction(async (tx) => {
    const [current] = await tx.select().from(checklistTemplates).where(and(templateTenantPredicate(organizationId, id), eq(checklistTemplates.rowVersion, expectedRowVersion))).limit(1);
    if (!current || current.status === "ARCHIVED") throw new TemplateConflictError("Template tidak tersedia atau sudah berubah.");
    const snapshot = checklistSchema.parse(current.draftSchema);
    const version = current.currentVersion + 1;
    const [published] = await tx.insert(checklistTemplateVersions).values({ organizationId, templateId: id, version, schemaSnapshot: snapshot, createdById: actorId }).returning();
    const [updated] = await tx.update(checklistTemplates).set({ status: "PUBLISHED", currentVersion: version, rowVersion: expectedRowVersion + 1, updatedAt: new Date() }).where(and(eq(checklistTemplates.organizationId, organizationId), eq(checklistTemplates.id, id), eq(checklistTemplates.rowVersion, expectedRowVersion))).returning();
    if (!updated) throw new TemplateConflictError("Template berubah ketika dipublikasikan.");
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "TEMPLATE_VERSION_PUBLISHED", resourceType: "CHECKLIST_TEMPLATE", resourceId: id, afterSummary: { name: current.name, version }, metadata: { versionId: published.id } });
    return published;
  });
}

export async function duplicateTemplate(organizationId: string, actorId: string, id: string) {
  const source = await getTemplate(organizationId, id);
  if (!source) return null;
  return createTemplate(organizationId, actorId, { name: `${source.name} (Copy)`, description: source.description ?? undefined, industry: source.industry ?? undefined, category: source.category ?? undefined, estimatedMinutes: source.estimatedMinutes ?? undefined, schema: source.draftSchema });
}

export async function archiveTemplate(organizationId: string, actorId: string, id: string) {
  return getDatabase().transaction(async (tx) => {
    const [row] = await tx.update(checklistTemplates).set({ status: "ARCHIVED", archivedAt: new Date(), updatedAt: new Date() }).where(templateTenantPredicate(organizationId, id)).returning({ id: checklistTemplates.id, name: checklistTemplates.name });
    if (!row) return false;
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "TEMPLATE_ARCHIVED", resourceType: "CHECKLIST_TEMPLATE", resourceId: id, beforeSummary: { name: row.name }, afterSummary: { archived: true } });
    return true;
  });
}
