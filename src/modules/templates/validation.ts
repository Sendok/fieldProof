import { z } from "zod";

export const checklistFieldTypes = [
  "SECTION_HEADING", "INSTRUCTION", "SHORT_TEXT", "LONG_TEXT", "NUMBER", "DATE", "TIME", "DATETIME",
  "SINGLE_SELECT", "MULTI_SELECT", "CHECKBOX", "PASS_FAIL_NA", "RATING", "PHOTO", "SIGNATURE", "GPS", "BARCODE_QR",
] as const;

export const checklistFieldTypeSchema = z.enum(checklistFieldTypes);

export const checklistFieldSchema = z.object({
  id: z.string().min(1),
  type: checklistFieldTypeSchema,
  label: z.string().trim().min(1).max(240),
  description: z.string().max(1_000).optional(),
  required: z.boolean().default(false),
  placeholder: z.string().max(240).optional(),
  options: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
  min: z.number().optional(),
  max: z.number().optional(),
  photoCategory: z.string().max(100).optional(),
  allowedFileCount: z.number().int().min(1).max(20).optional(),
  validationMessage: z.string().max(500).optional(),
  visibleInReport: z.boolean().default(true),
  workerInstruction: z.string().max(1_000).optional(),
}).superRefine((field, context) => {
  if (["SINGLE_SELECT", "MULTI_SELECT"].includes(field.type) && field.options.length < 2) {
    context.addIssue({ code: "custom", path: ["options"], message: "Field pilihan membutuhkan minimal dua opsi." });
  }
  if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
    context.addIssue({ code: "custom", path: ["max"], message: "Nilai maksimum harus lebih besar dari minimum." });
  }
});

export const checklistSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(180),
  description: z.string().max(1_000).optional(),
  fields: z.array(checklistFieldSchema).max(200),
});

export const evidenceRuleSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["MIN_PHOTOS", "REQUIRE_GPS", "REQUIRE_SIGNATURE"]),
  fieldId: z.string().min(1).optional(),
  minCount: z.number().int().min(1).max(20).optional(),
  description: z.string().max(500).optional(),
});

export const checklistSchema = z.object({
  schemaVersion: z.literal(1),
  sections: z.array(checklistSectionSchema).min(1).max(50),
  evidenceRules: z.array(evidenceRuleSchema).max(30).default([]),
}).superRefine((schema, context) => {
  const ids = schema.sections.flatMap((section) => [section.id, ...section.fields.map((field) => field.id)]);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", path: ["sections"], message: "Semua section dan field harus memiliki ID unik." });
  const fieldIds = new Set(schema.sections.flatMap((section) => section.fields.map((field) => field.id)));
  schema.evidenceRules.forEach((rule, index) => {
    if (rule.fieldId && !fieldIds.has(rule.fieldId)) context.addIssue({ code: "custom", path: ["evidenceRules", index, "fieldId"], message: "Evidence rule mereferensikan field yang tidak tersedia." });
  });
});

export type ChecklistSchema = z.infer<typeof checklistSchema>;
export type ChecklistField = z.infer<typeof checklistFieldSchema>;
export type ChecklistFieldType = z.infer<typeof checklistFieldTypeSchema>;

export const templateMetadataSchema = z.object({
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(2_000).optional(),
  industry: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  estimatedMinutes: z.coerce.number().int().min(1).max(1_440).optional(),
});

export function emptyChecklistSchema(): ChecklistSchema {
  return { schemaVersion: 1, sections: [{ id: crypto.randomUUID(), title: "Bagian 1", fields: [] }], evidenceRules: [] };
}
