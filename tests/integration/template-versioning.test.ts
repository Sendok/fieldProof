import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { templateTenantPredicate } from "@/modules/templates/service";
import { emptyChecklistSchema } from "@/modules/templates/validation";
import { checklistTemplates, checklistTemplateVersions, organizations, users } from "@/server/db/schema";

describe("template tenant isolation and immutable snapshots", () => {
  const client = new PGlite(); const db = drizzle(client);
  let organizationAId: string; let organizationBId: string; let actorId: string; let templateId: string;
  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "drizzle" });
    const [actor] = await db.insert(users).values({ name: "Builder", email: "builder@template.test" }).returning({ id: users.id }); actorId = actor.id;
    const orgs = await db.insert(organizations).values([{ name: "Org A", slug: "template-org-a" }, { name: "Org B", slug: "template-org-b" }]).returning({ id: organizations.id }); organizationAId = orgs[0].id; organizationBId = orgs[1].id;
    const original = emptyChecklistSchema(); original.sections[0].title = "Published title";
    const [template] = await db.insert(checklistTemplates).values({ organizationId: organizationBId, createdById: actorId, name: "Foreign template", status: "PUBLISHED", currentVersion: 1, draftSchema: original }).returning({ id: checklistTemplates.id }); templateId = template.id;
    await db.insert(checklistTemplateVersions).values({ organizationId: organizationBId, templateId, version: 1, schemaSnapshot: original, createdById: actorId });
  });
  afterAll(async () => client.close());
  it("does not expose another organization's template by UUID", async () => expect(await db.select().from(checklistTemplates).where(templateTenantPredicate(organizationAId, templateId))).toHaveLength(0));
  it("keeps the published snapshot unchanged when its working draft changes", async () => {
    const changed = emptyChecklistSchema(); changed.sections[0].title = "Changed draft";
    await db.update(checklistTemplates).set({ draftSchema: changed, rowVersion: 2 }).where(eq(checklistTemplates.id, templateId));
    const [version] = await db.select().from(checklistTemplateVersions).where(eq(checklistTemplateVersions.templateId, templateId));
    expect((version.schemaSnapshot as { sections: Array<{ title: string }> }).sections[0].title).toBe("Published title");
  });
  it("enforces one row for each template version number", async () => {
    await expect(db.insert(checklistTemplateVersions).values({ organizationId: organizationBId, templateId, version: 1, schemaSnapshot: emptyChecklistSchema(), createdById: actorId })).rejects.toThrow();
  });
});
