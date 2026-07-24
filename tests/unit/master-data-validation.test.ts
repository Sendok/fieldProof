import { describe, expect, it } from "vitest";

import { clientInputSchema } from "@/modules/clients/validation";
import { siteInputSchema } from "@/modules/sites/validation";
import { teamInputSchema } from "@/modules/teams/validation";

describe("master data validation", () => {
  it("normalizes client codes and rejects unsafe formats", () => {
    expect(clientInputSchema.parse({ code: "hotel-01", name: "Hotel Coral", status: "ACTIVE" }).code).toBe("HOTEL-01");
    expect(() => clientInputSchema.parse({ code: "hotel / 01", name: "Hotel Coral", status: "ACTIVE" })).toThrow();
  });

  it("accepts optional site coordinates but rejects out-of-range GPS", () => {
    const base = { clientId: crypto.randomUUID(), code: "SITE-01", name: "Main Building", address: "Jalan Utama 1", country: "ID", status: "ACTIVE" };
    expect(siteInputSchema.parse({ ...base, latitude: "", longitude: "" }).latitude).toBeUndefined();
    expect(() => siteInputSchema.parse({ ...base, latitude: "100" })).toThrow();
  });

  it("deduplicates team member intent at the service boundary", () => {
    const memberId = crypto.randomUUID();
    const parsed = teamInputSchema.parse({ name: "Tim Selatan", memberIds: [memberId, memberId] });
    expect(parsed.memberIds).toEqual([memberId]);
  });
});
