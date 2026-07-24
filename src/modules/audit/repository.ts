import { and, count, desc, eq, ilike } from "drizzle-orm";

import { getDatabase } from "@/server/db/client";
import { auditLogs, users } from "@/server/db/schema";

export async function listAuditEvents(input: { organizationId: string; search?: string; page: number; pageSize: number }) {
  const db = getDatabase();
  const where = and(eq(auditLogs.organizationId, input.organizationId), input.search ? ilike(auditLogs.action, `%${input.search}%`) : undefined);
  const [rows, total] = await Promise.all([
    db.select({ id: auditLogs.id, action: auditLogs.action, resourceType: auditLogs.resourceType, resourceId: auditLogs.resourceId, actorName: users.name, metadata: auditLogs.metadata, createdAt: auditLogs.createdAt }).from(auditLogs).leftJoin(users, eq(users.id, auditLogs.actorId)).where(where).orderBy(desc(auditLogs.createdAt)).limit(input.pageSize).offset((input.page - 1) * input.pageSize),
    db.select({ value: count() }).from(auditLogs).where(where),
  ]);
  return { rows, total: total[0]?.value ?? 0 };
}
