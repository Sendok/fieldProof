import { describe, expect, it } from "vitest";
import { assertWorkOrderTransition, canTransitionWorkOrder, derivePlanningStatus, InvalidWorkOrderTransitionError, nextOccurrence } from "@/modules/work-orders/state-machine";

describe("work order state machine",()=>{
  it("allows only explicit workflow transitions",()=>{expect(canTransitionWorkOrder("DRAFT","SCHEDULED")).toBe(true);expect(canTransitionWorkOrder("ASSIGNED","IN_PROGRESS")).toBe(true);expect(canTransitionWorkOrder("IN_PROGRESS","APPROVED")).toBe(false);expect(()=>assertWorkOrderTransition("COMPLETED","DRAFT")).toThrow(InvalidWorkOrderTransitionError);});
  it("requires a cancellation reason",()=>{expect(()=>assertWorkOrderTransition("ASSIGNED","CANCELLED")).toThrow("wajib memiliki alasan");expect(()=>assertWorkOrderTransition("ASSIGNED","CANCELLED","Client cancelled")).not.toThrow();});
  it("derives planning status from scheduling and assignments",()=>{expect(derivePlanningStatus({hasSchedule:false,assigneeCount:0})).toBe("DRAFT");expect(derivePlanningStatus({hasSchedule:true,assigneeCount:0})).toBe("SCHEDULED");expect(derivePlanningStatus({hasSchedule:false,assigneeCount:1})).toBe("ASSIGNED");});
  it("calculates daily, weekly, and month-end-safe recurrence",()=>{const start=new Date("2026-01-31T10:00:00.000Z");expect(nextOccurrence(start,"DAILY").toISOString()).toBe("2026-02-01T10:00:00.000Z");expect(nextOccurrence(start,"WEEKLY").toISOString()).toBe("2026-02-07T10:00:00.000Z");expect(nextOccurrence(start,"MONTHLY").toISOString()).toBe("2026-02-28T10:00:00.000Z");});
});
