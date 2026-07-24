import { auditLogs } from "@/server/db/schema";
import { getDatabase } from "@/server/db/client";

export interface AuditEventInput {
  organizationId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  beforeSummary?: Record<string, unknown>;
  afterSummary?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function appendAuditEvent(input: AuditEventInput): Promise<void> {
  await getDatabase().insert(auditLogs).values(input);
}
