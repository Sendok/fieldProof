"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { assertPermission } from "@/modules/memberships/permissions";
import { markNotificationRead, updateNotificationPreferences } from "@/modules/notifications/service";
import { bulkAssignWorkOrders, cancelWorkOrder, createWorkOrder, duplicateWorkOrder, updateWorkOrder } from "@/modules/work-orders/service";
import { workOrderInputSchema } from "@/modules/work-orders/validation";
import { requireTenantContext } from "@/server/auth/tenant";

const idSchema = z.uuid();

function parseWorkOrderForm(formData: FormData) {
  return workOrderInputSchema.parse({
    ...Object.fromEntries(formData),
    clientVisibility: formData.get("clientVisibility") === "on",
    clientApprovalRequired: formData.get("clientApprovalRequired") === "on",
    assigneeIds: formData.getAll("assigneeIds"),
  });
}

export async function createWorkOrderAction(formData: FormData): Promise<void> {
  const tenant=await requireTenantContext();assertPermission(tenant.role,"work_order:manage");
  const row=await createWorkOrder(tenant.organizationId,tenant.userId,parseWorkOrderForm(formData));redirect(`/app/work-orders/${row.id}`);
}

export async function updateWorkOrderAction(formData: FormData): Promise<void> {
  const tenant=await requireTenantContext();assertPermission(tenant.role,"work_order:manage");const id=idSchema.parse(formData.get("id"));
  await updateWorkOrder(tenant.organizationId,tenant.userId,id,z.coerce.number().int().parse(formData.get("rowVersion")),parseWorkOrderForm(formData));redirect(`/app/work-orders/${id}?saved=1`);
}

export async function cancelWorkOrderAction(formData: FormData): Promise<void> {
  const tenant=await requireTenantContext();assertPermission(tenant.role,"work_order:manage");const id=idSchema.parse(formData.get("id"));
  await cancelWorkOrder(tenant.organizationId,tenant.userId,id,z.string().trim().min(3).max(2_000).parse(formData.get("reason")));redirect(`/app/work-orders/${id}?cancelled=1`);
}

export async function duplicateWorkOrderAction(formData: FormData): Promise<void> {
  const tenant=await requireTenantContext();assertPermission(tenant.role,"work_order:manage");const row=await duplicateWorkOrder(tenant.organizationId,tenant.userId,idSchema.parse(formData.get("id")));if(row)redirect(`/app/work-orders/${row.id}`);redirect("/app/work-orders");
}

export async function bulkAssignWorkOrdersAction(formData: FormData): Promise<void> {
  const tenant=await requireTenantContext();assertPermission(tenant.role,"work_order:manage");await bulkAssignWorkOrders(tenant.organizationId,tenant.userId,formData.getAll("workOrderIds").map(String).map((id)=>idSchema.parse(id)),idSchema.parse(formData.get("membershipId")));revalidatePath("/app/work-orders");
}

export async function readNotificationAction(formData:FormData):Promise<void>{const tenant=await requireTenantContext();await markNotificationRead(tenant.organizationId,tenant.membershipId,formData.get("id")?idSchema.parse(formData.get("id")):undefined);revalidatePath("/app/notifications");revalidatePath("/app","layout");}

export async function updateNotificationPreferencesAction(formData:FormData):Promise<void>{const tenant=await requireTenantContext();await updateNotificationPreferences(tenant.membershipId,{inAppEnabled:formData.get("inAppEnabled")==="on",emailAssignments:formData.get("emailAssignments")==="on",emailScheduleChanges:formData.get("emailScheduleChanges")==="on",emailDueReminders:formData.get("emailDueReminders")==="on",emailWorkflowUpdates:formData.get("emailWorkflowUpdates")==="on"});revalidatePath("/app/notifications");}
