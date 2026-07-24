import { z } from "zod";
import {
  checklistSchema,
  type ChecklistField,
  type ChecklistSchema,
} from "@/modules/templates/validation";

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
});
export const answersSchema = z.record(z.string(), z.unknown());
export const draftSyncSchema = z.object({
  draftId: z.uuid(),
  expectedVersion: z.number().int().nonnegative(),
  answers: answersSchema,
  clientUpdatedAt: z.coerce.date(),
  location: locationSchema.nullable().optional(),
});
export const submissionInputSchema = z.object({
  answers: answersSchema,
  appVersion: z.string().min(1).max(80),
  location: locationSchema.nullable().optional(),
});

type EvidenceRef = {
  id: string;
  fieldId: string | null;
  category: string;
  uploadStatus: string;
  deletedAt: Date | null;
};

function evidenceIds(answer: unknown): string[] {
  if (typeof answer === "string") return [answer];
  if (Array.isArray(answer))
    return answer.filter((item): item is string => typeof item === "string");
  return [];
}

export function isChecklistAnswerComplete(
  field: ChecklistField,
  answer: unknown,
  evidence: EvidenceRef[],
): boolean {
  if (["SECTION_HEADING", "INSTRUCTION"].includes(field.type)) return true;
  if (field.type === "CHECKBOX") return answer === true;
  if (field.type === "NUMBER" || field.type === "RATING")
    return typeof answer === "number" && Number.isFinite(answer);
  if (field.type === "MULTI_SELECT")
    return Array.isArray(answer) && answer.length > 0;
  if (field.type === "PHOTO" || field.type === "SIGNATURE") {
    const ids = new Set(evidenceIds(answer));
    return evidence.some(
      (item) =>
        ids.has(item.id) &&
        item.fieldId === field.id &&
        item.uploadStatus === "READY" &&
        !item.deletedAt,
    );
  }
  if (field.type === "GPS") return locationSchema.safeParse(answer).success;
  return typeof answer === "string" && answer.trim().length > 0;
}

function validateAnswer(
  field: ChecklistField,
  answer: unknown,
  evidence: EvidenceRef[],
): string | undefined {
  if (
    answer == null ||
    answer === "" ||
    (Array.isArray(answer) && !answer.length)
  )
    return undefined;
  const fallback = field.validationMessage || `${field.label} tidak valid.`;
  if (field.type === "NUMBER" || field.type === "RATING") {
    if (typeof answer !== "number" || !Number.isFinite(answer)) return fallback;
    if (field.min !== undefined && answer < field.min) return fallback;
    if (field.max !== undefined && answer > field.max) return fallback;
  }
  if (field.type === "SINGLE_SELECT" && !field.options.includes(String(answer)))
    return fallback;
  if (
    field.type === "MULTI_SELECT" &&
    (!Array.isArray(answer) ||
      answer.some(
        (item) => typeof item !== "string" || !field.options.includes(item),
      ))
  )
    return fallback;
  if (
    field.type === "DATE" &&
    (typeof answer !== "string" || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(answer))
  )
    return fallback;
  if (
    field.type === "TIME" &&
    (typeof answer !== "string" || !/^[0-9]{2}:[0-9]{2}/.test(answer))
  )
    return fallback;
  if (
    field.type === "DATETIME" &&
    (typeof answer !== "string" || Number.isNaN(Date.parse(answer)))
  )
    return fallback;
  if (field.type === "GPS" && !locationSchema.safeParse(answer).success)
    return fallback;
  if (field.type === "PHOTO" || field.type === "SIGNATURE") {
    const ids = evidenceIds(answer);
    const ready = evidence.filter(
      (item) =>
        ids.includes(item.id) &&
        item.fieldId === field.id &&
        item.uploadStatus === "READY" &&
        !item.deletedAt,
    );
    if (ids.length !== ready.length) return fallback;
    if (field.allowedFileCount && ready.length > field.allowedFileCount)
      return fallback;
    if (
      field.type === "SIGNATURE" &&
      !ready.some((item) => item.category === "SIGNATURE")
    )
      return fallback;
  }
  return undefined;
}

export function validateSubmissionChecklist(
  rawSchema: unknown,
  answers: Record<string, unknown>,
  evidence: EvidenceRef[],
) {
  const schema = checklistSchema.parse(rawSchema);
  const fields = schema.sections.flatMap((section) => section.fields);
  const required = fields.filter(
    (field) =>
      field.required &&
      !["SECTION_HEADING", "INSTRUCTION"].includes(field.type),
  );
  const missing = required
    .filter(
      (field) => !isChecklistAnswerComplete(field, answers[field.id], evidence),
    )
    .map((field) => ({ fieldId: field.id, label: field.label }));
  const fieldErrors = fields
    .map((field) => ({
      fieldId: field.id,
      message: validateAnswer(field, answers[field.id], evidence),
    }))
    .filter((item): item is { fieldId: string; message: string } =>
      Boolean(item.message),
    );
  const ruleErrors: string[] = [];
  for (const rule of schema.evidenceRules) {
    const ready = evidence.filter(
      (item) =>
        item.uploadStatus === "READY" &&
        !item.deletedAt &&
        (!rule.fieldId || item.fieldId === rule.fieldId),
    );
    if (
      rule.type === "MIN_PHOTOS" &&
      ready.filter((item) => item.category !== "SIGNATURE").length <
        (rule.minCount ?? 1)
    )
      ruleErrors.push(`Minimal ${rule.minCount ?? 1} foto belum terpenuhi.`);
    if (
      rule.type === "REQUIRE_SIGNATURE" &&
      !ready.some((item) => item.category === "SIGNATURE")
    )
      ruleErrors.push("Tanda tangan wajib belum tersedia.");
    if (rule.type === "REQUIRE_GPS") {
      const target = rule.fieldId
        ? answers[rule.fieldId]
        : Object.values(answers).find(
            (value) => locationSchema.safeParse(value).success,
          );
      if (!locationSchema.safeParse(target).success)
        ruleErrors.push("Lokasi GPS wajib belum tersedia.");
    }
  }
  return {
    schema,
    requiredCount: required.length,
    completedRequiredCount: required.length - missing.length,
    missing,
    fieldErrors,
    ruleErrors,
    valid:
      missing.length === 0 &&
      fieldErrors.length === 0 &&
      ruleErrors.length === 0,
  };
}

export function checklistProgress(
  schema: ChecklistSchema,
  answers: Record<string, unknown>,
  evidence: EvidenceRef[],
) {
  return validateSubmissionChecklist(schema, answers, evidence);
}
