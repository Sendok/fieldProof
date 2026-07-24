import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { organizationTenantPredicate } from "@/modules/organizations/service";
import { organizations } from "@/server/db/schema";

describe("tenant isolation", () => {
  const client = new PGlite();
  const db = drizzle(client);
  let organizationAId: string;
  let organizationBId: string;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "drizzle" });
    const inserted = await db
      .insert(organizations)
      .values([
        { name: "Organization A", slug: "organization-a" },
        { name: "Organization B", slug: "organization-b" },
      ])
      .returning({ id: organizations.id });
    organizationAId = inserted[0].id;
    organizationBId = inserted[1].id;
  });

  afterAll(async () => client.close());

  it("does not return an Organization B record in Organization A context", async () => {
    const leaked = await db.select().from(organizations).where(organizationTenantPredicate(organizationAId, organizationBId));
    expect(leaked).toHaveLength(0);
  });

  it("returns a resource only inside the matching organization context", async () => {
    const visible = await db.select().from(organizations).where(organizationTenantPredicate(organizationAId, organizationAId));
    expect(visible[0]?.name).toBe("Organization A");
  });
});
