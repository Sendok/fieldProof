import { and, count, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  assertExecutionAccess,
  canAccessEvidence,
  ExecutionAccessError,
} from "@/modules/execution/service";
import type { OrganizationRole } from "@/modules/memberships/permissions";
import { getDatabase } from "@/server/db/client";
import {
  checklistTemplateVersions,
  evidenceFiles,
  signatures,
  workOrderDrafts,
  workOrders,
} from "@/server/db/schema";
import {
  createPresignedDownload,
  createPresignedUpload,
  deletePrivateObject,
  headPrivateObject,
} from "@/server/storage/s3";
import { checklistSchema } from "@/modules/templates/validation";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 15 * 1024 * 1024;
const maxEvidence = 20;
export const evidenceRequestSchema = z.object({
  id: z.uuid(),
  draftId: z.uuid().optional(),
  fieldId: z.string().min(1).max(100).optional(),
  category: z.enum([
    "BEFORE",
    "DURING",
    "AFTER",
    "ISSUE",
    "DOCUMENT",
    "SIGNATURE",
    "OTHER",
  ]),
  originalFilename: z.string().min(1).max(500),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive().max(maxFileSize),
  capturedAt: z.coerce.date().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export const evidenceCompleteSchema = z.object({
  width: z.number().int().positive().max(30_000).optional(),
  height: z.number().int().positive().max(30_000).optional(),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  caption: z.string().max(1_000).optional(),
  consentText: z.string().min(3).max(1_000).optional(),
});

function extension(mime: string) {
  return mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
}

export async function prepareEvidenceUpload(
  organizationId: string,
  membershipId: string,
  workOrderId: string,
  raw: unknown,
) {
  const input = evidenceRequestSchema.parse(raw);
  if (!allowedMimeTypes.has(input.mimeType))
    throw new Error("UNSUPPORTED_FILE_TYPE");
  const work = await assertExecutionAccess(
    organizationId,
    membershipId,
    workOrderId,
  );
  if (!["IN_PROGRESS", "REVISION_REQUIRED"].includes(work.status))
    throw new ExecutionAccessError(
      "Evidence hanya dapat diunggah saat pekerjaan aktif.",
    );
  const db = getDatabase();
  if (input.draftId) {
    const [draft] = await db
      .select({ id: workOrderDrafts.id })
      .from(workOrderDrafts)
      .where(
        and(
          eq(workOrderDrafts.id, input.draftId),
          eq(workOrderDrafts.organizationId, organizationId),
          eq(workOrderDrafts.workOrderId, workOrderId),
          eq(workOrderDrafts.membershipId, membershipId),
        ),
      )
      .limit(1);
    if (!draft) throw new ExecutionAccessError("Draft evidence tidak valid.");
  }
  const [templateVersion] = await db
    .select({ schema: checklistTemplateVersions.schemaSnapshot })
    .from(checklistTemplateVersions)
    .where(
      and(
        eq(checklistTemplateVersions.organizationId, organizationId),
        eq(checklistTemplateVersions.id, work.templateVersionId),
      ),
    )
    .limit(1);
  const schema = checklistSchema.parse(templateVersion?.schema);
  const field = input.fieldId
    ? schema.sections
        .flatMap((section) => section.fields)
        .find((item) => item.id === input.fieldId)
    : undefined;
  if (input.fieldId && !field)
    throw new ExecutionAccessError(
      "Field evidence tidak tersedia pada template.",
    );
  if ((input.category === "SIGNATURE") !== (field?.type === "SIGNATURE"))
    throw new ExecutionAccessError(
      "Signature harus terhubung ke field signature.",
    );
  if (field && !["PHOTO", "SIGNATURE"].includes(field.type))
    throw new ExecutionAccessError("Field ini tidak menerima file evidence.");
  const [existing] = await db
    .select()
    .from(evidenceFiles)
    .where(eq(evidenceFiles.id, input.id))
    .limit(1);
  if (existing) {
    if (
      existing.organizationId !== organizationId ||
      existing.workOrderId !== workOrderId ||
      existing.uploadedByMembershipId !== membershipId
    )
      throw new ExecutionAccessError("Evidence ID tidak valid.");
    if (existing.uploadStatus === "READY")
      return { evidence: existing, uploadUrl: null };
    return {
      evidence: existing,
      uploadUrl: await createPresignedUpload({
        key: existing.storageKey,
        mimeType: existing.mimeType,
        sizeBytes: existing.sizeBytes,
      }),
    };
  }
  const [currentCount, fieldCount] = await Promise.all([
    db
      .select({ value: count() })
      .from(evidenceFiles)
      .where(
        and(
          eq(evidenceFiles.organizationId, organizationId),
          eq(evidenceFiles.workOrderId, workOrderId),
          isNull(evidenceFiles.deletedAt),
        ),
      ),
    input.fieldId
      ? db
          .select({ value: count() })
          .from(evidenceFiles)
          .where(
            and(
              eq(evidenceFiles.organizationId, organizationId),
              eq(evidenceFiles.workOrderId, workOrderId),
              eq(evidenceFiles.fieldId, input.fieldId),
              isNull(evidenceFiles.deletedAt),
            ),
          )
      : Promise.resolve([{ value: 0 }]),
  ]);
  if ((currentCount[0]?.value ?? 0) >= maxEvidence)
    throw new Error("EVIDENCE_LIMIT_REACHED");
  if (
    field?.allowedFileCount &&
    (fieldCount[0]?.value ?? 0) >= field.allowedFileCount
  )
    throw new Error("FIELD_EVIDENCE_LIMIT_REACHED");
  const storageKey = `organizations/${organizationId}/work-orders/${workOrderId}/${crypto.randomUUID()}.${extension(input.mimeType)}`;
  const [row] = await db
    .insert(evidenceFiles)
    .values({
      id: input.id,
      organizationId,
      workOrderId,
      draftId: input.draftId,
      fieldId: input.fieldId,
      category: input.category,
      originalFilename: input.originalFilename,
      storageKey,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      capturedAt: input.capturedAt,
      latitude: input.latitude,
      longitude: input.longitude,
      uploadedByMembershipId: membershipId,
    })
    .returning();
  return {
    evidence: row,
    uploadUrl: await createPresignedUpload({
      key: storageKey,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    }),
  };
}

export async function completeEvidenceUpload(
  organizationId: string,
  membershipId: string,
  workOrderId: string,
  evidenceId: string,
  raw: unknown,
) {
  const input = evidenceCompleteSchema.parse(raw);
  await assertExecutionAccess(organizationId, membershipId, workOrderId);
  const db = getDatabase();
  const [row] = await db
    .select()
    .from(evidenceFiles)
    .where(
      and(
        eq(evidenceFiles.id, evidenceId),
        eq(evidenceFiles.organizationId, organizationId),
        eq(evidenceFiles.workOrderId, workOrderId),
        eq(evidenceFiles.uploadedByMembershipId, membershipId),
        isNull(evidenceFiles.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new ExecutionAccessError("Evidence tidak ditemukan.");
  if (row.category === "SIGNATURE" && !input.consentText)
    throw new Error("SIGNATURE_CONSENT_REQUIRED");
  if (row.uploadStatus === "READY") return row;
  const head = await headPrivateObject(row.storageKey);
  if (
    Number(head.ContentLength) !== row.sizeBytes ||
    head.ContentType !== row.mimeType
  )
    throw new Error("UPLOADED_OBJECT_MISMATCH");
  const [updated] = await db
    .update(evidenceFiles)
    .set({ ...input, uploadStatus: "READY", uploadedAt: new Date() })
    .where(
      and(
        eq(evidenceFiles.id, evidenceId),
        eq(evidenceFiles.uploadStatus, "PENDING"),
      ),
    )
    .returning();
  if (row.category === "SIGNATURE" && row.fieldId && input.consentText)
    await db
      .insert(signatures)
      .values({
        organizationId,
        workOrderId,
        evidenceFileId: evidenceId,
        fieldId: row.fieldId,
        signerMembershipId: membershipId,
        consentText: input.consentText,
      })
      .onConflictDoNothing();
  return updated ?? row;
}

export async function getEvidenceDownload(
  organizationId: string,
  membershipId: string,
  role: OrganizationRole,
  evidenceId: string,
) {
  const [row] = await getDatabase()
    .select()
    .from(evidenceFiles)
    .where(
      and(
        eq(evidenceFiles.id, evidenceId),
        eq(evidenceFiles.organizationId, organizationId),
        eq(evidenceFiles.uploadStatus, "READY"),
        isNull(evidenceFiles.deletedAt),
      ),
    )
    .limit(1);
  if (
    !row ||
    !(await canAccessEvidence(
      organizationId,
      membershipId,
      role,
      row.workOrderId,
    ))
  )
    throw new ExecutionAccessError("Evidence tidak ditemukan.");
  return createPresignedDownload(row.storageKey);
}

export async function deleteEvidence(
  organizationId: string,
  membershipId: string,
  workOrderId: string,
  evidenceId: string,
) {
  await assertExecutionAccess(organizationId, membershipId, workOrderId);
  const db = getDatabase();
  const [work] = await db
    .select({ status: workOrders.status })
    .from(workOrders)
    .where(
      and(
        eq(workOrders.organizationId, organizationId),
        eq(workOrders.id, workOrderId),
      ),
    )
    .limit(1);
  if (!work || !["IN_PROGRESS", "REVISION_REQUIRED"].includes(work.status))
    throw new ExecutionAccessError(
      "Evidence tidak dapat dihapus setelah submission.",
    );
  const [row] = await db
    .update(evidenceFiles)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(evidenceFiles.id, evidenceId),
        eq(evidenceFiles.organizationId, organizationId),
        eq(evidenceFiles.workOrderId, workOrderId),
        eq(evidenceFiles.uploadedByMembershipId, membershipId),
        isNull(evidenceFiles.deletedAt),
      ),
    )
    .returning();
  if (row) await deletePrivateObject(row.storageKey);
  return Boolean(row);
}
