import type { organizationRole } from "@/server/db/schema";

export type OrganizationRole = (typeof organizationRole.enumValues)[number];
export type Permission =
  | "organization:manage"
  | "membership:manage"
  | "client:manage"
  | "site:manage"
  | "template:manage"
  | "work_order:manage"
  | "work_order:execute"
  | "submission:review"
  | "report:read"
  | "audit:read"
  | "subscription:manage";

const permissions: Record<OrganizationRole, ReadonlySet<Permission>> = {
  OWNER: new Set(["organization:manage", "membership:manage", "client:manage", "site:manage", "template:manage", "work_order:manage", "work_order:execute", "submission:review", "report:read", "audit:read", "subscription:manage"]),
  ADMIN: new Set(["membership:manage", "client:manage", "site:manage", "template:manage", "work_order:manage", "report:read"]),
  SUPERVISOR: new Set(["work_order:manage", "work_order:execute", "submission:review", "report:read"]),
  FIELD_WORKER: new Set(["work_order:execute"]),
  CLIENT_REVIEWER: new Set(["report:read"]),
  AUDITOR: new Set(["report:read", "audit:read"]),
};

export function hasPermission(role: OrganizationRole, permission: Permission): boolean {
  return permissions[role].has(permission);
}

export function assertPermission(role: OrganizationRole, permission: Permission): void {
  if (!hasPermission(role, permission)) throw new Error("FORBIDDEN");
}
