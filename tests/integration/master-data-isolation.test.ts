import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { clientTenantPredicate } from "@/modules/clients/service";
import { siteTenantPredicate } from "@/modules/sites/service";
import { clients, organizations, sites, users } from "@/server/db/schema";

describe("master data tenant isolation", () => {
  const client = new PGlite();
  const db = drizzle(client);
  let organizationAId: string;
  let organizationBId: string;
  let clientBId: string;
  let siteBId: string;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "drizzle" });
    const [actor] = await db.insert(users).values({ name: "Admin", email: "admin@isolation.test", emailVerified: new Date() }).returning({ id: users.id });
    const orgs = await db.insert(organizations).values([{ name: "Org A", slug: "master-org-a" }, { name: "Org B", slug: "master-org-b" }]).returning({ id: organizations.id });
    organizationAId = orgs[0].id; organizationBId = orgs[1].id;
    const [foreignClient] = await db.insert(clients).values({ organizationId: organizationBId, createdById: actor.id, code: "B-01", name: "Client B" }).returning({ id: clients.id });
    clientBId = foreignClient.id;
    const [foreignSite] = await db.insert(sites).values({ organizationId: organizationBId, clientId: clientBId, createdById: actor.id, code: "BS-01", name: "Site B", address: "Foreign address" }).returning({ id: sites.id });
    siteBId = foreignSite.id;
  });

  afterAll(async () => client.close());

  it("does not expose another organization's client by UUID", async () => {
    const rows = await db.select().from(clients).where(clientTenantPredicate(organizationAId, clientBId));
    expect(rows).toHaveLength(0);
  });

  it("does not expose another organization's site by UUID", async () => {
    const rows = await db.select().from(sites).where(siteTenantPredicate(organizationAId, siteBId));
    expect(rows).toHaveLength(0);
  });

  it("keeps organization-scoped codes independently unique", async () => {
    const [actor] = await db.select({ id: users.id }).from(users).limit(1);
    await expect(db.insert(clients).values({ organizationId: organizationAId, createdById: actor.id, code: "B-01", name: "Same code in A" })).resolves.toBeDefined();
  });
});
