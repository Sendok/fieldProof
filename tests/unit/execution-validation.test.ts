import { describe, expect, it } from "vitest";
import { validateSubmissionChecklist } from "@/modules/execution/validation";
import type { ChecklistSchema } from "@/modules/templates/validation";

const schema: ChecklistSchema = {
  schemaVersion: 1,
  sections: [
    {
      id: "section",
      title: "Execution",
      fields: [
        {
          id: "check",
          type: "CHECKBOX",
          label: "Confirmed",
          required: true,
          options: [],
          visibleInReport: true,
        },
        {
          id: "note",
          type: "SHORT_TEXT",
          label: "Note",
          required: true,
          options: [],
          visibleInReport: true,
        },
        {
          id: "photo",
          type: "PHOTO",
          label: "Photo",
          required: true,
          options: [],
          visibleInReport: true,
          allowedFileCount: 2,
        },
        {
          id: "gps",
          type: "GPS",
          label: "Location",
          required: true,
          options: [],
          visibleInReport: true,
        },
      ],
    },
  ],
  evidenceRules: [
    { id: "photo-rule", type: "MIN_PHOTOS", fieldId: "photo", minCount: 1 },
  ],
};
describe("execution checklist validation", () => {
  it("rejects missing required fields and evidence", () => {
    const result = validateSubmissionChecklist(
      schema,
      { check: false, note: "", photo: [], gps: null },
      [],
    );
    expect(result.valid).toBe(false);
    expect(result.missing.map((item) => item.fieldId)).toEqual([
      "check",
      "note",
      "photo",
      "gps",
    ]);
    expect(result.ruleErrors).toHaveLength(1);
  });
  it("accepts complete answers with ready field-scoped evidence", () => {
    const evidence = {
      id: "evidence",
      fieldId: "photo",
      category: "AFTER",
      uploadStatus: "READY",
      deletedAt: null,
    };
    const result = validateSubmissionChecklist(
      schema,
      {
        check: true,
        note: "Done",
        photo: ["evidence"],
        gps: { latitude: -6.2, longitude: 106.8 },
      },
      [evidence],
    );
    expect(result.valid).toBe(true);
    expect(result.completedRequiredCount).toBe(4);
  });
  it("does not count pending or deleted evidence", () => {
    const answers = {
      check: true,
      note: "Done",
      photo: ["evidence"],
      gps: { latitude: -6.2, longitude: 106.8 },
    };
    expect(
      validateSubmissionChecklist(schema, answers, [
        {
          id: "evidence",
          fieldId: "photo",
          category: "AFTER",
          uploadStatus: "PENDING",
          deletedAt: null,
        },
      ]).valid,
    ).toBe(false);
    expect(
      validateSubmissionChecklist(schema, answers, [
        {
          id: "evidence",
          fieldId: "photo",
          category: "AFTER",
          uploadStatus: "READY",
          deletedAt: new Date(),
        },
      ]).valid,
    ).toBe(false);
  });
  it("rejects populated answers that violate field constraints", () => {
    const constrained: ChecklistSchema = {
      schemaVersion: 1,
      sections: [
        {
          id: "section",
          title: "Validation",
          fields: [
            {
              id: "score",
              type: "NUMBER",
              label: "Score",
              required: true,
              options: [],
              visibleInReport: true,
              min: 1,
              max: 5,
            },
            {
              id: "choice",
              type: "SINGLE_SELECT",
              label: "Choice",
              required: true,
              options: ["A", "B"],
              visibleInReport: true,
            },
          ],
        },
      ],
      evidenceRules: [],
    };
    const result = validateSubmissionChecklist(
      constrained,
      { score: 8, choice: "C" },
      [],
    );
    expect(result.valid).toBe(false);
    expect(result.missing).toHaveLength(0);
    expect(result.fieldErrors.map((item) => item.fieldId)).toEqual([
      "score",
      "choice",
    ]);
  });
});
