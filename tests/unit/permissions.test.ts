import { describe, expect, it } from "vitest";

import { assertPermission, hasPermission } from "@/modules/memberships/permissions";

describe("organization permissions", () => {
  it("gives owner full organization and subscription control", () => {
    expect(hasPermission("OWNER", "organization:manage")).toBe(true);
    expect(hasPermission("OWNER", "subscription:manage")).toBe(true);
  });

  it("prevents field workers from reviewing their own work", () => {
    expect(hasPermission("FIELD_WORKER", "work_order:execute")).toBe(true);
    expect(hasPermission("FIELD_WORKER", "submission:review")).toBe(false);
    expect(() => assertPermission("FIELD_WORKER", "submission:review")).toThrow("FORBIDDEN");
  });

  it("keeps auditors read-only", () => {
    expect(hasPermission("AUDITOR", "audit:read")).toBe(true);
    expect(hasPermission("AUDITOR", "work_order:manage")).toBe(false);
    expect(hasPermission("AUDITOR", "membership:manage")).toBe(false);
  });

  it("does not let admins manage the organization or subscription", () => {
    expect(hasPermission("ADMIN", "membership:manage")).toBe(true);
    expect(hasPermission("ADMIN", "organization:manage")).toBe(false);
    expect(hasPermission("ADMIN", "subscription:manage")).toBe(false);
  });
});
