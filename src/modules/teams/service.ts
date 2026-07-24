import { and, asc, count, eq, inArray, isNull, sql } from "drizzle-orm";

import { getDatabase } from "@/server/db/client";
import { auditLogs, memberships, teamMembers, teams, users } from "@/server/db/schema";

type TeamInput = { name: string; area?: string; supervisorMembershipId?: string; memberIds: string[] };

export async function listTeams(organizationId: string, page = 1, pageSize = 25) {
  const db = getDatabase();
  const where = and(eq(teams.organizationId, organizationId), isNull(teams.archivedAt));
  const [rows, total] = await Promise.all([
    db.select({ id: teams.id, name: teams.name, area: teams.area, supervisorMembershipId: teams.supervisorMembershipId, supervisorName: users.name, memberCount: sql<number>`count(${teamMembers.membershipId})::int` }).from(teams).leftJoin(memberships, eq(memberships.id, teams.supervisorMembershipId)).leftJoin(users, eq(users.id, memberships.userId)).leftJoin(teamMembers, eq(teamMembers.teamId, teams.id)).where(where).groupBy(teams.id, users.name).orderBy(asc(teams.name)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ value: count() }).from(teams).where(where),
  ]);
  return { rows, total: total[0]?.value ?? 0 };
}

async function assertMembershipsBelongToOrganization(tx: Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0], organizationId: string, membershipIds: string[]): Promise<void> {
  if (membershipIds.length === 0) return;
  const found = await tx.select({ id: memberships.id }).from(memberships).where(and(eq(memberships.organizationId, organizationId), eq(memberships.status, "ACTIVE"), inArray(memberships.id, membershipIds)));
  if (found.length !== new Set(membershipIds).size) throw new Error("MEMBERSHIP_NOT_FOUND");
}

export async function createTeam(organizationId: string, actorId: string, input: TeamInput) {
  return getDatabase().transaction(async (tx) => {
    const membershipIds = [...input.memberIds, ...(input.supervisorMembershipId ? [input.supervisorMembershipId] : [])];
    await assertMembershipsBelongToOrganization(tx, organizationId, membershipIds);
    const [row] = await tx.insert(teams).values({ organizationId, name: input.name, area: input.area, supervisorMembershipId: input.supervisorMembershipId || null }).returning();
    if (input.memberIds.length) await tx.insert(teamMembers).values(input.memberIds.map((membershipId) => ({ teamId: row.id, membershipId })));
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "TEAM_CREATED", resourceType: "TEAM", resourceId: row.id, afterSummary: { name: row.name, memberCount: input.memberIds.length } });
    return row;
  });
}

export async function updateTeam(organizationId: string, actorId: string, id: string, input: TeamInput) {
  return getDatabase().transaction(async (tx) => {
    const [before] = await tx.select().from(teams).where(and(eq(teams.organizationId, organizationId), eq(teams.id, id), isNull(teams.archivedAt))).limit(1);
    if (!before) return null;
    const membershipIds = [...input.memberIds, ...(input.supervisorMembershipId ? [input.supervisorMembershipId] : [])];
    await assertMembershipsBelongToOrganization(tx, organizationId, membershipIds);
    const [row] = await tx.update(teams).set({ name: input.name, area: input.area, supervisorMembershipId: input.supervisorMembershipId || null, updatedAt: new Date() }).where(and(eq(teams.organizationId, organizationId), eq(teams.id, id))).returning();
    await tx.delete(teamMembers).where(eq(teamMembers.teamId, id));
    if (input.memberIds.length) await tx.insert(teamMembers).values(input.memberIds.map((membershipId) => ({ teamId: id, membershipId })));
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "TEAM_UPDATED", resourceType: "TEAM", resourceId: id, beforeSummary: { name: before.name, area: before.area }, afterSummary: { name: row.name, area: row.area, memberCount: input.memberIds.length } });
    return row;
  });
}

export async function archiveTeam(organizationId: string, actorId: string, id: string): Promise<boolean> {
  return getDatabase().transaction(async (tx) => {
    const [row] = await tx.update(teams).set({ archivedAt: new Date(), updatedAt: new Date() }).where(and(eq(teams.organizationId, organizationId), eq(teams.id, id), isNull(teams.archivedAt))).returning({ name: teams.name });
    if (!row) return false;
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "TEAM_ARCHIVED", resourceType: "TEAM", resourceId: id, beforeSummary: { name: row.name }, afterSummary: { archived: true } });
    return true;
  });
}
