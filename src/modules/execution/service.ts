import { and, asc, desc, eq, gte, inArray, isNull, lt, or } from "drizzle-orm";
import type { OrganizationRole } from "@/modules/memberships/permissions";
import { createNotifications } from "@/modules/notifications/service";
import { assertWorkOrderTransition } from "@/modules/work-orders/state-machine";
import { getDatabase } from "@/server/db/client";
import {
  auditLogs,
  checklistTemplateVersions,
  clients,
  evidenceFiles,
  memberships,
  sites,
  submissionRevisions,
  submissions,
  users,
  workOrderAssignments,
  workOrderDrafts,
  workOrders,
  workOrderStatusHistory,
} from "@/server/db/schema";
import {
  draftSyncSchema,
  submissionInputSchema,
  validateSubmissionChecklist,
} from "./validation";
import { distanceMeters } from "./location";

export class ExecutionAccessError extends Error {}
export class WorkLocationError extends Error {}
export class DraftConflictError extends Error {
  constructor(
    message: string,
    public readonly currentVersion?: number,
    public readonly workOrderStatus?: string,
  ) {
    super(message);
  }
}
export class SubmissionValidationError extends Error {
  constructor(
    public readonly details: {
      missing: Array<{ fieldId: string; label: string }>;
      fieldErrors: Array<{ fieldId: string; message: string }>;
      ruleErrors: string[];
    },
  ) {
    super("Checklist belum lengkap.");
  }
}

async function assignedWorkOrder(
  organizationId: string,
  membershipId: string,
  workOrderId: string,
) {
  const [row] = await getDatabase()
    .select({ workOrder: workOrders })
    .from(workOrders)
    .innerJoin(
      workOrderAssignments,
      and(
        eq(workOrderAssignments.workOrderId, workOrders.id),
        eq(workOrderAssignments.membershipId, membershipId),
      ),
    )
    .where(
      and(
        eq(workOrders.organizationId, organizationId),
        eq(workOrders.id, workOrderId),
      ),
    )
    .limit(1);
  return row?.workOrder ?? null;
}

export async function assertExecutionAccess(
  organizationId: string,
  membershipId: string,
  workOrderId: string,
) {
  const row = await assignedWorkOrder(
    organizationId,
    membershipId,
    workOrderId,
  );
  if (!row)
    throw new ExecutionAccessError(
      "Tugas tidak ditemukan atau tidak ditugaskan kepada Anda.",
    );
  return row;
}

export async function listMyTasks(
  organizationId: string,
  membershipId: string,
  scope: "all" | "today" | "upcoming" | "completed",
) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1_000);
  const condition =
    scope === "today"
      ? or(
          and(
            gte(workOrders.scheduleStart, start),
            lt(workOrders.scheduleStart, end),
            eq(workOrders.status, "ASSIGNED"),
          ),
          inArray(workOrders.status, ["IN_PROGRESS", "REVISION_REQUIRED"]),
        )
      : scope === "upcoming"
        ? and(
            gte(workOrders.scheduleStart, end),
            inArray(workOrders.status, ["ASSIGNED", "SCHEDULED"]),
          )
        : scope === "completed"
          ? inArray(workOrders.status, [
              "SUBMITTED",
              "UNDER_REVIEW",
              "APPROVED",
              "COMPLETED",
            ])
          : inArray(workOrders.status, [
              "ASSIGNED",
              "IN_PROGRESS",
              "REVISION_REQUIRED",
            ]);
  return getDatabase()
    .select({
      workOrder: workOrders,
      clientName: clients.name,
      siteName: sites.name,
      siteAddress: sites.address,
      siteLatitude: sites.latitude,
      siteLongitude: sites.longitude,
    })
    .from(workOrderAssignments)
    .innerJoin(workOrders, eq(workOrders.id, workOrderAssignments.workOrderId))
    .innerJoin(clients, eq(clients.id, workOrders.clientId))
    .innerJoin(sites, eq(sites.id, workOrders.siteId))
    .where(
      and(
        eq(workOrders.organizationId, organizationId),
        eq(workOrderAssignments.membershipId, membershipId),
        condition,
      ),
    )
    .orderBy(asc(workOrders.scheduleStart), desc(workOrders.updatedAt));
}

export async function getExecutionDetail(
  organizationId: string,
  membershipId: string,
  workOrderId: string,
) {
  await assertExecutionAccess(organizationId, membershipId, workOrderId);
  const db = getDatabase();
  const [detail] = await db
    .select({
      workOrder: workOrders,
      clientName: clients.name,
      siteName: sites.name,
      siteAddress: sites.address,
      siteLatitude: sites.latitude,
      siteLongitude: sites.longitude,
      siteContact: sites.contactPerson,
      sitePhone: sites.phone,
      templateSnapshot: checklistTemplateVersions.schemaSnapshot,
      supervisorName: users.name,
    })
    .from(workOrders)
    .innerJoin(clients, eq(clients.id, workOrders.clientId))
    .innerJoin(sites, eq(sites.id, workOrders.siteId))
    .innerJoin(
      checklistTemplateVersions,
      eq(checklistTemplateVersions.id, workOrders.templateVersionId),
    )
    .leftJoin(
      memberships,
      eq(memberships.id, workOrders.supervisorMembershipId),
    )
    .leftJoin(users, eq(users.id, memberships.userId))
    .where(
      and(
        eq(workOrders.organizationId, organizationId),
        eq(workOrders.id, workOrderId),
      ),
    )
    .limit(1);
  if (!detail) throw new ExecutionAccessError("Tugas tidak ditemukan.");
  const [draft, evidence, reportRevision] = await Promise.all([
    db
      .select()
      .from(workOrderDrafts)
      .where(
        and(
          eq(workOrderDrafts.organizationId, organizationId),
          eq(workOrderDrafts.workOrderId, workOrderId),
          eq(workOrderDrafts.membershipId, membershipId),
        ),
      )
      .limit(1),
    db
      .select()
      .from(evidenceFiles)
      .where(
        and(
          eq(evidenceFiles.organizationId, organizationId),
          eq(evidenceFiles.workOrderId, workOrderId),
          isNull(evidenceFiles.deletedAt),
        ),
      )
      .orderBy(asc(evidenceFiles.createdAt)),
    db
      .select({ location: submissionRevisions.location })
      .from(submissionRevisions)
      .where(and(eq(submissionRevisions.organizationId, organizationId), eq(submissionRevisions.workOrderId, workOrderId)))
      .orderBy(desc(submissionRevisions.revision))
      .limit(1),
  ]);
  return { ...detail, draft: draft[0] ?? null, evidence, reportLocation: reportRevision[0]?.location ?? null };
}

export async function startWorkOrder(
  organizationId: string,
  membershipId: string,
  actorId: string,
  workOrderId: string,
  location: { latitude: number; longitude: number; accuracy?: number },
) {
  await assertExecutionAccess(organizationId, membershipId, workOrderId);
  return getDatabase().transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(workOrders)
      .where(
        and(
          eq(workOrders.organizationId, organizationId),
          eq(workOrders.id, workOrderId),
        ),
      )
      .limit(1);
    if (!before) throw new ExecutionAccessError("Tugas tidak ditemukan.");
    if (before.status === "IN_PROGRESS") return before;
    if (before.targetLatitude == null || before.targetLongitude == null)
      throw new WorkLocationError(
        "Koordinat target tugas belum tersedia. Minta supervisor memperbarui site dan assignment.",
      );
    if (location.accuracy == null || location.accuracy > 50)
      throw new WorkLocationError(
        `Akurasi GPS belum memadai (±${Math.round(location.accuracy ?? 0)} m). Tunggu hingga akurasi 50 meter atau lebih baik.`,
      );
    const startDistanceMeters = distanceMeters(location, {
      latitude: before.targetLatitude,
      longitude: before.targetLongitude,
    });
    if (startDistanceMeters > before.startRadiusMeters)
      throw new WorkLocationError(
        `Anda berjarak ${Math.round(startDistanceMeters)} meter dari lokasi tugas. Pekerjaan hanya dapat dimulai dalam radius ${before.startRadiusMeters} meter.`,
      );
    assertWorkOrderTransition(before.status, "IN_PROGRESS");
    const now = new Date();
    const [updated] = await tx
      .update(workOrders)
      .set({
        status: "IN_PROGRESS",
        actualStartedAt: before.actualStartedAt ?? now,
        actualFinishedAt: null,
        rowVersion: before.rowVersion + 1,
        updatedAt: now,
      })
      .where(
        and(
          eq(workOrders.id, workOrderId),
          eq(workOrders.rowVersion, before.rowVersion),
        ),
      )
      .returning();
    if (!updated)
      throw new DraftConflictError(
        "Status tugas berubah. Muat ulang halaman.",
        undefined,
        before.status,
      );
    await tx.insert(workOrderStatusHistory).values({
      organizationId,
      workOrderId,
      fromStatus: before.status,
      toStatus: "IN_PROGRESS",
      actorId,
      reason: "Worker started work",
    });
    await tx.insert(auditLogs).values({
      organizationId,
      actorId,
      action: "WORK_ORDER_STARTED",
      resourceType: "WORK_ORDER",
      resourceId: workOrderId,
      beforeSummary: { status: before.status },
      afterSummary: {
        status: "IN_PROGRESS",
        startedAt: now,
        location,
        target: {
          latitude: before.targetLatitude,
          longitude: before.targetLongitude,
        },
        startRadiusMeters: before.startRadiusMeters,
        startDistanceMeters: Math.round(startDistanceMeters),
      },
    });
    return { ...updated, startDistanceMeters: Math.round(startDistanceMeters) };
  });
}

export async function syncWorkOrderDraft(
  organizationId: string,
  membershipId: string,
  workOrderId: string,
  rawInput: unknown,
) {
  const input = draftSyncSchema.parse(rawInput);
  await assertExecutionAccess(organizationId, membershipId, workOrderId);
  const db = getDatabase();
  return db.transaction(async (tx) => {
    const [work] = await tx
      .select({ status: workOrders.status })
      .from(workOrders)
      .where(
        and(
          eq(workOrders.organizationId, organizationId),
          eq(workOrders.id, workOrderId),
        ),
      )
      .limit(1);
    if (!work || ["CANCELLED", "APPROVED", "COMPLETED"].includes(work.status))
      throw new DraftConflictError(
        "Status work order berubah. Draft lokal disimpan sebagai recoverable copy.",
        undefined,
        work?.status,
      );
    const [current] = await tx
      .select()
      .from(workOrderDrafts)
      .where(
        and(
          eq(workOrderDrafts.workOrderId, workOrderId),
          eq(workOrderDrafts.membershipId, membershipId),
        ),
      )
      .limit(1);
    if (!current) {
      if (input.expectedVersion !== 0)
        throw new DraftConflictError(
          "Draft server tidak ditemukan untuk versi ini.",
          0,
          work.status,
        );
      const [created] = await tx
        .insert(workOrderDrafts)
        .values({
          id: input.draftId,
          organizationId,
          workOrderId,
          membershipId,
          answers: input.answers,
          location: input.location ?? null,
          clientUpdatedAt: input.clientUpdatedAt,
        })
        .returning();
      return created;
    }
    if (
      current.id !== input.draftId ||
      current.version !== input.expectedVersion
    )
      throw new DraftConflictError(
        "Draft telah berubah di perangkat lain.",
        current.version,
        work.status,
      );
    const [updated] = await tx
      .update(workOrderDrafts)
      .set({
        answers: input.answers,
        location: input.location ?? null,
        clientUpdatedAt: input.clientUpdatedAt,
        version: current.version + 1,
        status: "ACTIVE",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(workOrderDrafts.id, current.id),
          eq(workOrderDrafts.version, current.version),
        ),
      )
      .returning();
    if (!updated)
      throw new DraftConflictError(
        "Draft berubah ketika disinkronkan.",
        current.version,
        work.status,
      );
    return updated;
  });
}

export async function submitWorkOrder(
  organizationId: string,
  membershipId: string,
  actorId: string,
  workOrderId: string,
  rawInput: unknown,
) {
  const input = submissionInputSchema.parse(rawInput);
  const work = await assertExecutionAccess(
    organizationId,
    membershipId,
    workOrderId,
  );
  if (!["IN_PROGRESS", "REVISION_REQUIRED"].includes(work.status))
    throw new DraftConflictError(
      "Work order tidak dapat disubmit pada status saat ini.",
      undefined,
      work.status,
    );
  const db = getDatabase();
  const [version, evidence] = await Promise.all([
    db
      .select()
      .from(checklistTemplateVersions)
      .where(
        and(
          eq(checklistTemplateVersions.organizationId, organizationId),
          eq(checklistTemplateVersions.id, work.templateVersionId),
        ),
      )
      .limit(1),
    db
      .select()
      .from(evidenceFiles)
      .where(
        and(
          eq(evidenceFiles.organizationId, organizationId),
          eq(evidenceFiles.workOrderId, workOrderId),
          eq(evidenceFiles.uploadStatus, "READY"),
          isNull(evidenceFiles.deletedAt),
        ),
      ),
  ]);
  if (!version[0])
    throw new ExecutionAccessError("Template version tidak tersedia.");
  const validation = validateSubmissionChecklist(
    version[0].schemaSnapshot,
    input.answers,
    evidence,
  );
  if (!validation.valid)
    throw new SubmissionValidationError({
      missing: validation.missing,
      fieldErrors: validation.fieldErrors,
      ruleErrors: validation.ruleErrors,
    });
  const result = await db.transaction(async (tx) => {
    const [currentWork] = await tx
      .select()
      .from(workOrders)
      .where(
        and(
          eq(workOrders.organizationId, organizationId),
          eq(workOrders.id, workOrderId),
        ),
      )
      .limit(1);
    if (
      !currentWork ||
      !["IN_PROGRESS", "REVISION_REQUIRED"].includes(currentWork.status)
    )
      throw new DraftConflictError(
        "Status work order berubah sebelum submission.",
        undefined,
        currentWork?.status,
      );
    assertWorkOrderTransition(currentWork.status, "SUBMITTED");
    let [submission] = await tx
      .select()
      .from(submissions)
      .where(eq(submissions.workOrderId, workOrderId))
      .limit(1);
    if (!submission) {
      [submission] = await tx
        .insert(submissions)
        .values({ organizationId, workOrderId })
        .returning();
    }
    const revision = submission.currentRevision + 1;
    const finishedAt = new Date();
    await tx.insert(submissionRevisions).values({
      organizationId,
      submissionId: submission.id,
      workOrderId,
      revision,
      templateSnapshot: validation.schema,
      answersSnapshot: input.answers,
      evidenceSnapshot: evidence,
      submittedByMembershipId: membershipId,
      appVersion: input.appVersion,
      location: input.location,
      startedAt: currentWork.actualStartedAt,
      finishedAt,
    });
    await tx
      .update(submissions)
      .set({ currentRevision: revision, updatedAt: finishedAt })
      .where(eq(submissions.id, submission.id));
    const [transitioned] = await tx
      .update(workOrders)
      .set({
        status: "SUBMITTED",
        actualFinishedAt: finishedAt,
        rowVersion: currentWork.rowVersion + 1,
        updatedAt: finishedAt,
      })
      .where(
        and(
          eq(workOrders.id, workOrderId),
          eq(workOrders.rowVersion, currentWork.rowVersion),
        ),
      )
      .returning({ id: workOrders.id });
    if (!transitioned)
      throw new DraftConflictError(
        "Status work order berubah ketika disubmit.",
        undefined,
        currentWork.status,
      );
    await tx
      .delete(workOrderDrafts)
      .where(
        and(
          eq(workOrderDrafts.workOrderId, workOrderId),
          eq(workOrderDrafts.membershipId, membershipId),
        ),
      );
    await tx.insert(workOrderStatusHistory).values({
      organizationId,
      workOrderId,
      fromStatus: currentWork.status,
      toStatus: "SUBMITTED",
      actorId,
      reason: `Submission revision ${revision}`,
    });
    await tx.insert(auditLogs).values({
      organizationId,
      actorId,
      action: "WORK_ORDER_SUBMITTED",
      resourceType: "WORK_ORDER",
      resourceId: workOrderId,
      beforeSummary: { status: currentWork.status },
      afterSummary: {
        status: "SUBMITTED",
        revision,
        submittedAt: finishedAt,
      },
    });
    return {
      revision,
      supervisorMembershipId: currentWork.supervisorMembershipId,
      number: currentWork.number,
      title: currentWork.title,
    };
  });
  if (result.supervisorMembershipId)
    await createNotifications({
      organizationId,
      membershipIds: [result.supervisorMembershipId],
      type: "SUBMISSION_NEW",
      title: `Submission baru: ${result.number}`,
      body: `${result.title} · revision ${result.revision}`,
      resourceId: workOrderId,
      href: `/app/work-orders/${workOrderId}`,
    });
  return result;
}

export async function canAccessEvidence(
  organizationId: string,
  membershipId: string,
  role: OrganizationRole,
  workOrderId: string,
) {
  if (["OWNER", "ADMIN", "SUPERVISOR"].includes(role)) {
    const [row] = await getDatabase()
      .select({ id: workOrders.id })
      .from(workOrders)
      .where(
        and(
          eq(workOrders.organizationId, organizationId),
          eq(workOrders.id, workOrderId),
        ),
      )
      .limit(1);
    return Boolean(row);
  }
  return Boolean(
    await assignedWorkOrder(organizationId, membershipId, workOrderId),
  );
}
