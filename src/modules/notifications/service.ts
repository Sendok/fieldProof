import { and, count, desc, eq, isNull } from "drizzle-orm";

import { getDatabase } from "@/server/db/client";
import { memberships, notificationPreferences, notifications, users } from "@/server/db/schema";
import { enqueueNotificationEmail, safelyEnqueue } from "@/server/queue/jobs";
import { sendEmail } from "@/server/email/client";
import { getRuntimeEnv } from "@/server/env";

export type NotificationType = "WORK_ORDER_ASSIGNED" | "WORK_ORDER_SCHEDULE_CHANGED" | "WORK_ORDER_DUE_SOON" | "WORK_ORDER_STATUS_CHANGED" | "SUBMISSION_NEW";

export async function createNotifications(input: { organizationId: string; membershipIds: string[]; type: NotificationType; title: string; body: string; resourceId: string; href: string }) {
  if (!input.membershipIds.length) return [];
  const db = getDatabase();
  const active = await db.select({ id: memberships.id }).from(memberships).where(and(eq(memberships.organizationId, input.organizationId), eq(memberships.status, "ACTIVE")));
  const allowed = new Set(active.map((item) => item.id));
  const recipients = [...new Set(input.membershipIds.filter((id) => allowed.has(id)))];
  if (!recipients.length) return [];
  const rows = await db.insert(notifications).values(recipients.map((recipientMembershipId) => ({ organizationId: input.organizationId, recipientMembershipId, type: input.type, title: input.title, body: input.body, resourceType: "WORK_ORDER", resourceId: input.resourceId, href: input.href }))).returning();
  await Promise.all(rows.map((row) => safelyEnqueue(() => enqueueNotificationEmail(row.id), { notificationId: row.id })));
  return rows;
}

export async function listNotifications(organizationId: string, membershipId: string, limit = 50) {
  const preferences = await getNotificationPreferences(membershipId);
  if (!preferences.inAppEnabled) return [];
  return getDatabase().select().from(notifications).where(and(eq(notifications.organizationId, organizationId), eq(notifications.recipientMembershipId, membershipId))).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function countUnreadNotifications(organizationId: string, membershipId: string): Promise<number> {
  const preferences = await getNotificationPreferences(membershipId);
  if (!preferences.inAppEnabled) return 0;
  const [row] = await getDatabase().select({ value: count() }).from(notifications).where(and(eq(notifications.organizationId, organizationId), eq(notifications.recipientMembershipId, membershipId), isNull(notifications.readAt)));
  return row?.value ?? 0;
}

export async function markNotificationRead(organizationId: string, membershipId: string, notificationId?: string) {
  return getDatabase().update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.organizationId, organizationId), eq(notifications.recipientMembershipId, membershipId), notificationId ? eq(notifications.id, notificationId) : undefined));
}

export async function getNotificationPreferences(membershipId: string) {
  const [row] = await getDatabase().select().from(notificationPreferences).where(eq(notificationPreferences.membershipId, membershipId)).limit(1);
  return row ?? { membershipId, inAppEnabled: true, emailAssignments: true, emailScheduleChanges: true, emailDueReminders: true, emailWorkflowUpdates: true, updatedAt: new Date() };
}

export async function updateNotificationPreferences(membershipId: string, input: { inAppEnabled: boolean; emailAssignments: boolean; emailScheduleChanges: boolean; emailDueReminders: boolean; emailWorkflowUpdates: boolean }) {
  return getDatabase().insert(notificationPreferences).values({ membershipId, ...input }).onConflictDoUpdate({ target: notificationPreferences.membershipId, set: { ...input, updatedAt: new Date() } });
}

export async function deliverNotificationEmail(notificationId: string): Promise<void> {
  const db = getDatabase();
  const [row] = await db.select({ notification: notifications, email: users.email, preferences: notificationPreferences }).from(notifications).innerJoin(memberships, eq(memberships.id, notifications.recipientMembershipId)).innerJoin(users, eq(users.id, memberships.userId)).leftJoin(notificationPreferences, eq(notificationPreferences.membershipId, memberships.id)).where(and(eq(notifications.id, notificationId), isNull(notifications.emailSentAt))).limit(1);
  if (!row) return;
  const enabled = row.notification.type === "WORK_ORDER_ASSIGNED" ? row.preferences?.emailAssignments !== false : row.notification.type === "WORK_ORDER_SCHEDULE_CHANGED" ? row.preferences?.emailScheduleChanges !== false : row.notification.type === "WORK_ORDER_DUE_SOON" ? row.preferences?.emailDueReminders !== false : row.preferences?.emailWorkflowUpdates !== false;
  if (!enabled) return;
  const href = row.notification.href ? new URL(row.notification.href, getRuntimeEnv().APP_URL).toString() : getRuntimeEnv().APP_URL;
  await sendEmail({ to: row.email, subject: row.notification.title, text: `${row.notification.body}\n\n${href}` });
  await db.update(notifications).set({ emailSentAt: new Date() }).where(eq(notifications.id, notificationId));
}
