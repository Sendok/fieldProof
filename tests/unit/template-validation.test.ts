import { describe, expect, it } from "vitest";
import { builtInTemplates } from "@/modules/templates/built-ins";
import { checklistFieldTypes, checklistSchema, emptyChecklistSchema } from "@/modules/templates/validation";

describe("template schema contract", () => {
  it("supports all checklist field types", () => expect(checklistFieldTypes).toHaveLength(17));
  it("ships five complete, valid built-in templates", () => {
    expect(builtInTemplates).toHaveLength(5);
    expect(builtInTemplates.map((template) => template.name)).toEqual(["Cleaning Service Daily Checklist", "Property Inspection", "Maintenance Visit", "Contractor Daily Progress", "Sales Visit Report"]);
    for (const template of builtInTemplates) {
      expect(checklistSchema.safeParse(template.schema).success).toBe(true);
      expect(template.schema.sections.flatMap((section) => section.fields).length).toBeGreaterThanOrEqual(8);
    }
  });
  it("rejects duplicate stable IDs and select fields without two options", () => {
    const schema = emptyChecklistSchema();
    schema.sections[0].fields.push({ id: schema.sections[0].id, type: "SINGLE_SELECT", label: "Status", required: true, options: ["Only"], visibleInReport: true });
    expect(checklistSchema.safeParse(schema).success).toBe(false);
  });
});
