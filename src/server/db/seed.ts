import { and, eq } from "drizzle-orm";

import { builtInTemplates } from "@/modules/templates/built-ins";
import { getDatabase, getPool } from "@/server/db/client";
import { checklistTemplates, checklistTemplateVersions, clients, memberships, organizations, organizationSettings, sites, teamMembers, teams, users, workOrderAssignments, workOrders, workOrderStatusHistory } from "@/server/db/schema";
import { logger } from "@/server/observability/logger";
import { hashPassword } from "@/server/security/password";

const developmentUsers = [
  ["superadmin@fieldproof.local", "Platform Super Admin", null],
  ["owner@fieldproof.local", "Budi Santoso", "OWNER"],
  ["admin@fieldproof.local", "Maya Putri", "ADMIN"],
  ["supervisor@fieldproof.local", "Raka Pratama", "SUPERVISOR"],
  ["worker@fieldproof.local", "Dewi Lestari", "FIELD_WORKER"],
  ["client@fieldproof.local", "Nadia Coral Bay", "CLIENT_REVIEWER"],
  ["auditor@fieldproof.local", "Arif Wijaya", "AUDITOR"],
] as const;

async function seed(): Promise<void> {
  if (process.env.NODE_ENV === "production") throw new Error("Development seed is disabled in production.");
  const db = getDatabase();
  const passwordHash = await hashPassword("FieldProofDev123!");
  for (const [email, name] of developmentUsers) {
    await db.insert(users).values({ email, name, passwordHash, emailVerified: new Date() }).onConflictDoNothing();
  }
  await db.insert(organizations).values({ name: "PT Bersih Sentosa", slug: "pt-bersih-sentosa", industry: "Cleaning Service" }).onConflictDoNothing();
  const [organization] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, "pt-bersih-sentosa")).limit(1);
  await db.insert(organizationSettings).values({ organizationId: organization.id }).onConflictDoNothing();
  for (const [email, , role] of developmentUsers) {
    if (!role) continue;
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    await db.insert(memberships).values({ organizationId: organization.id, userId: user.id, role }).onConflictDoNothing();
  }
  const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.email, "owner@fieldproof.local")).limit(1);
  await db.insert(clients).values({ organizationId: organization.id, createdById: owner.id, code: "HCB", name: "Hotel Coral Bay", contactPerson: "Nadia Coral Bay", email: "client@fieldproof.local" }).onConflictDoNothing();
  const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.organizationId, organization.id)).limit(1);
  await db.insert(sites).values({ organizationId: organization.id, clientId: client.id, createdById: owner.id, code: "HCB-MAIN", name: "Hotel Coral Bay — Main Building", address: "Jl. Pantai Coral No. 1, Jakarta" }).onConflictDoNothing();
  await db.insert(teams).values({ organizationId: organization.id, name: "Tim Cleaning Pagi", area: "Jakarta" }).onConflictDoNothing();
  const [team] = await db.select({ id: teams.id }).from(teams).where(eq(teams.organizationId, organization.id)).limit(1);
  const activeMemberships = await db.select({ id: memberships.id }).from(memberships).where(eq(memberships.organizationId, organization.id));
  for (const member of activeMemberships) await db.insert(teamMembers).values({ teamId: team.id, membershipId: member.id }).onConflictDoNothing();
  for (const builtIn of builtInTemplates) {
    const [existing] = await db.select({ id: checklistTemplates.id }).from(checklistTemplates).where(and(eq(checklistTemplates.organizationId, organization.id), eq(checklistTemplates.name, builtIn.name), eq(checklistTemplates.isBuiltIn, true))).limit(1);
    if (existing) continue;
    const [template] = await db.insert(checklistTemplates).values({ organizationId: organization.id, createdById: owner.id, name: builtIn.name, description: builtIn.description, industry: builtIn.industry, category: builtIn.category, estimatedMinutes: builtIn.estimatedMinutes, isBuiltIn: true, status: "PUBLISHED", currentVersion: 1, draftSchema: builtIn.schema }).returning({ id: checklistTemplates.id });
    await db.insert(checklistTemplateVersions).values({ organizationId: organization.id, templateId: template.id, version: 1, schemaSnapshot: builtIn.schema, createdById: owner.id });
  }
  const [site] = await db.select({ id: sites.id }).from(sites).where(eq(sites.organizationId, organization.id)).limit(1);
  const [templateVersion] = await db.select({ id: checklistTemplateVersions.id }).from(checklistTemplateVersions).where(eq(checklistTemplateVersions.organizationId, organization.id)).limit(1);
  const [worker] = await db.select({ id: memberships.id }).from(memberships).innerJoin(users, eq(users.id, memberships.userId)).where(and(eq(memberships.organizationId, organization.id), eq(users.email, "worker@fieldproof.local"))).limit(1);
  const [supervisor] = await db.select({ id: memberships.id }).from(memberships).innerJoin(users, eq(users.id, memberships.userId)).where(and(eq(memberships.organizationId, organization.id), eq(users.email, "supervisor@fieldproof.local"))).limit(1);
  const now = Date.now();
  const demoWorkOrders = [
    { number: "WO-DEMO-SCHEDULED", title: "Morning lobby cleaning", status: "SCHEDULED", start: now + 24 * 60 * 60_000, due: now + 30 * 60 * 60_000 },
    { number: "WO-DEMO-INPROGRESS", title: "Guest room deep cleaning", status: "IN_PROGRESS", start: now - 60 * 60_000, due: now + 3 * 60 * 60_000 },
    { number: "WO-DEMO-SUBMITTED", title: "Pool area inspection", status: "SUBMITTED", start: now - 24 * 60 * 60_000, due: now - 20 * 60 * 60_000 },
    { number: "WO-DEMO-REVISION", title: "Ballroom preparation", status: "REVISION_REQUIRED", start: now - 48 * 60 * 60_000, due: now - 40 * 60 * 60_000 },
    { number: "WO-DEMO-APPROVED", title: "Restaurant closing checklist", status: "APPROVED", start: now - 72 * 60 * 60_000, due: now - 68 * 60 * 60_000 },
    { number: "WO-DEMO-OVERDUE", title: "Emergency stairwell inspection", status: "ASSIGNED", start: now - 12 * 60 * 60_000, due: now - 6 * 60 * 60_000 },
  ] as const;
  for (const demo of demoWorkOrders) {
    const [created] = await db.insert(workOrders).values({ organizationId: organization.id, createdById: owner.id, number: demo.number, title: demo.title, clientId: client.id, siteId: site.id, templateVersionId: templateVersion.id, teamId: team.id, supervisorMembershipId: supervisor.id, priority: demo.number.endsWith("OVERDUE") ? "URGENT" : "NORMAL", scheduleStart: new Date(demo.start), scheduleEnd: new Date(demo.start + 2 * 60 * 60_000), dueDate: new Date(demo.due), status: demo.status, instructions: "Ikuti checklist dan dokumentasikan setiap temuan." }).onConflictDoNothing().returning({ id: workOrders.id });
    if (!created) continue;
    if (demo.status !== "SCHEDULED") await db.insert(workOrderAssignments).values({ workOrderId: created.id, membershipId: worker.id, assignedById: owner.id });
    await db.insert(workOrderStatusHistory).values({ organizationId: organization.id, workOrderId: created.id, toStatus: demo.status, actorId: owner.id, reason: "Development demo fixture" });
  }
  logger.info("Development authentication and tenancy seed completed");
}

seed().catch((error: unknown) => {
  logger.error("Database seed failed", { error: error instanceof Error ? error.message : "Unknown error" });
  process.exitCode = 1;
}).finally(async () => getPool().end());
