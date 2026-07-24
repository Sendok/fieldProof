import { hasPermission } from "@/modules/memberships/permissions";
import { listWorkOrders } from "@/modules/work-orders/service";
import { requireTenantContext } from "@/server/auth/tenant";

const csv=(value:unknown)=>`"${String(value??"").replaceAll('"','""')}"`;
export async function GET(){const tenant=await requireTenantContext();if(!hasPermission(tenant.role,"work_order:manage"))return new Response("Forbidden",{status:403});const data=await listWorkOrders({organizationId:tenant.organizationId,sort:"newest",page:1,pageSize:10_000});const lines=[["Number","Title","Client","Site","Status","Priority","Schedule Start","Schedule End","Due Date"].map(csv).join(","),...data.rows.map(({workOrder,clientName,siteName})=>[workOrder.number,workOrder.title,clientName,siteName,workOrder.status,workOrder.priority,workOrder.scheduleStart?.toISOString(),workOrder.scheduleEnd?.toISOString(),workOrder.dueDate?.toISOString()].map(csv).join(","))];return new Response(`\uFEFF${lines.join("\r\n")}`,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="fieldproof-work-orders-${new Date().toISOString().slice(0,10)}.csv"`}})}
