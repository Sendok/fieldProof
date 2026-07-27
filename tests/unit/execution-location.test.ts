import { describe, expect, it } from "vitest";
import {
  distanceMeters,
  formatWorkDuration,
} from "@/modules/execution/location";

describe("execution location", () => {
  it("calculates zero distance for identical coordinates", () => {
    expect(
      distanceMeters(
        { latitude: -6.1754, longitude: 106.8272 },
        { latitude: -6.1754, longitude: 106.8272 },
      ),
    ).toBe(0);
  });

  it("distinguishes positions inside and outside a 50 meter radius", () => {
    const target = { latitude: -6.1754, longitude: 106.8272 };
    expect(
      distanceMeters(target, { latitude: -6.17513, longitude: 106.8272 }),
    ).toBeLessThan(50);
    expect(
      distanceMeters(target, { latitude: -6.1745, longitude: 106.8272 }),
    ).toBeGreaterThan(50);
  });

  it("formats a measured work duration", () => {
    expect(
      formatWorkDuration(
        "2026-07-25T01:00:00.000Z",
        "2026-07-25T02:02:03.000Z",
      ),
    ).toBe("1j 2m 3d");
  });
});
