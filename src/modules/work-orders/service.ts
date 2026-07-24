import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lt, lte, notInArray, or, sql } from "drizzle-orm";

import { createNotifications } from "@/modules/notifications/service";
import { derivePlanningStatus, assertWorkOrderTransition, nextOccurrence, type WorkOrderStatus } from "./state-machine";
import type { WorkOrderInput } from "./validation";
import { getDatabase } from "@/server/db/client";
import { auditLogs, checklistTemplates, checklistTemplateVersions, clients, memberships, notifications, sites, teams, users, workOrderAssignments, workOrders, workOrderStatusHistory } from "@/server/db/schema";
import { enqueueRecurringWorkOrder, safelyEnqueue } from "@/server/queue/jobs";

export class WorkOrderConflictError extends Error {}
export class WorkOrderReferenceError extends Error {}

export function workOrderTenantPredicate(organizationId: string, id: string) {
  return and(eq(workOrders.organizationId, organizationId), eq(workOrders.id, id));
}

function workOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `WO-${date}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function validateReferences(tx: Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0], organizationId: string, input: WorkOrderInput): Promise<void> {
  const [client, site, version] = await Promise.all([
    tx.select({ id: clients.id }).from(clients).where(and(eq(clients.organizationId, organizationId), eq(clients.id, input.clientId), isNull(clients.archivedAt))).limit(1),
    tx.select({ id: sites.id, clientId: sites.clientId }).from(sites).where(and(eq(sites.organizationId, organizationId), eq(sites.id, input.siteId), isNull(sites.archivedAt))).limit(1),
    tx.select({ id: checklistTemplateVersions.id }).from(checklistTemplateVersions).where(and(eq(checklistTemplateVersions.organizationId, organizationId), eq(checklistTemplateVersions.id, input.templateVersionId))).limit(1),
  ]);
  if (!client[0] || !site[0] || site[0].clientId !== input.clientId || !version[0]) throw new WorkOrderReferenceError("Client, site, atau template version tidak valid untuk organisasi ini.");
  if (input.teamId && !(await tx.select({ id: teams.id }).from(teams).where(and(eq(teams.organizationId, organizationId), eq(teams.id, input.teamId), isNull(teams.archivedAt))).limit(1))[0]) throw new WorkOrderReferenceError("Team tidak valid.");
  const memberIds = [...new Set([...input.assigneeIds, ...(input.supervisorMembershipId ? [input.supervisorMembershipId] : [])])];
  if (memberIds.length) {
    const members = await tx.select({ id: memberships.id, role: memberships.role }).from(memberships).where(and(eq(memberships.organizationId, organizationId), eq(memberships.status, "ACTIVE"), inArray(memberships.id, memberIds)));
    if (members.length !== memberIds.length) throw new WorkOrderReferenceError("Assignee atau supervisor tidak valid.");
    const supervisor = input.supervisorMembershipId ? members.find((member) => member.id === input.supervisorMembershipId) : undefined;
    if (supervisor && !["OWNER", "ADMIN", "SUPERVISOR"].includes(supervisor.role)) throw new WorkOrderReferenceError("Supervisor harus memiliki role supervisor atau administrator.");
  }
}

function databaseValues(input: WorkOrderInput) {
  return {
    title: input.title, description: input.description || null, clientId: input.clientId, siteId: input.siteId, templateVersionId: input.templateVersionId, priority: input.priority,
    scheduleStart: input.scheduleStart ?? null, scheduleEnd: input.scheduleEnd ?? null, dueDate: input.dueDate ?? null, teamId: input.teamId ?? null, supervisorMembershipId: input.supervisorMembershipId ?? null,
    internalNotes: input.internalNotes || null, instructions: input.instructions || null, tags: input.tags, clientVisibility: input.clientVisibility, clientApprovalRequired: input.clientApprovalRequired,
    recurrenceFrequency: input.recurrenceFrequency ?? null, recurrenceInterval: input.recurrenceInterval, recurrenceEndAt: input.recurrenceEndAt ?? null,
  };
}

async function scheduleNextRecurrence(row: typeof workOrders.$inferSelect): Promise<void> {
  if (!row.recurrenceFrequency || !row.scheduleStart || !row.recurrenceSeriesId) return;
  const occurrenceAt = nextOccurrence(row.scheduleStart, row.recurrenceFrequency, row.recurrenceInterval ?? 1);
  if (row.recurrenceEndAt && occurrenceAt > row.recurrenceEndAt) return;
  await safelyEnqueue(() => enqueueRecurringWorkOrder({ workOrderId: row.id, seriesId: row.recurrenceSeriesId!, occurrenceAt }), { workOrderId: row.id, seriesId: row.recurrenceSeriesId });
}

export async function createWorkOrder(organizationId: string, actorId: string, input: WorkOrderInput) {
  const recurrenceSeriesId = input.recurrenceFrequency ? crypto.randomUUID() : null;
  const status = derivePlanningStatus({ hasSchedule: Boolean(input.scheduleStart), assigneeCount: input.assigneeIds.length });
  const row = await getDatabase().transaction(async (tx) => {
    await validateReferences(tx, organizationId, input);
    const [created] = await tx.insert(workOrders).values({ organizationId, createdById: actorId, number: workOrderNumber(), ...databaseValues(input), status, recurrenceSeriesId, recurrenceOccurrenceAt: recurrenceSeriesId ? input.scheduleStart : null }).returning();
    if (input.assigneeIds.length) await tx.insert(workOrderAssignments).values([...new Set(input.assigneeIds)].map((membershipId) => ({ workOrderId: created.id, membershipId, assignedById: actorId })));
    await tx.insert(workOrderStatusHistory).values({ organizationId, workOrderId: created.id, toStatus: status, actorId, reason: "Work order created" });
    await tx.insert(auditLogs).values({ organizationId, actorId, action: "WORK_ORDER_CREATED", resourceType: "WORK_ORDER", resourceId: created.id, afterSummary: { number: created.number, title: created.title, status } });
    return created;
  });
  await createNotifications({ organizationId, membershipIds: input.assigneeIds, type: "WORK_ORDER_ASSIGNED", title: `Assignment baru: ${row.number}`, body: row.title, resourceId: row.id, href: `/app/work-orders/${row.id}` });
  await scheduleNextRecurrence(row);
  return row;
}

export async function listWorkOrders(input: { organizationId: string; search?: string; status?: WorkOrderStatus; priority?: "LOW"|"NORMAL"|"HIGH"|"URGENT"; sort: "newest"|"oldest"|"schedule_asc"|"due_asc"|"priority"; page: number; pageSize: number }) {
  const search = input.search?.trim();
  const where = and(eq(workOrders.organizationId, input.organizationId), input.status ? eq(workOrders.status, input.status) : undefined, input.priority ? eq(workOrders.priority, input.priority) : undefined, search ? or(ilike(workOrders.title, `%${search}%`), ilike(workOrders.number, `%${search}%`), ilike(clients.name, `%${search}%`), ilike(sites.name, `%${search}%`)) : undefined);
  const order = input.sort === "oldest" ? asc(workOrders.createdAt) : input.sort === "schedule_asc" ? asc(workOrders.scheduleStart) : input.sort === "due_asc" ? asc(workOrders.dueDate) : input.sort === "priority" ? sql`case ${workOrders.priority} when 'URGENT' then 1 when 'HIGH' then 2 when 'NORMAL' then 3 else 4 end` : desc(workOrders.createdAt);
  const db = getDatabase();
  const base = db.select({ workOrder: workOrders, clientName: clients.name, siteName: sites.name }).from(workOrders).innerJoin(clients, eq(clients.id, workOrders.clientId)).innerJoin(sites, eq(sites.id, workOrders.siteId));
  const [rows, total] = await Promise.all([base.where(where).orderBy(order).limit(input.pageSize).offset((input.page-1)*input.pageSize), db.select({ value: count() }).from(workOrders).innerJoin(clients, eq(clients.id, workOrders.clientId)).innerJoin(sites, eq(sites.id, workOrders.siteId)).where(where)]);
  return { rows, total: total[0]?.value ?? 0 };
}

export async function getWorkOrder(organizationId: string, id: string) {
  const db = getDatabase();
  const [row] = await db.select({ workOrder: workOrders, clientName: clients.name, siteName: sites.name, siteAddress: sites.address, templateName: checklistTemplates.name, templateVersion: checklistTemplateVersions.version, teamName: teams.name }).from(workOrders).innerJoin(clients, eq(clients.id, workOrders.clientId)).innerJoin(sites, eq(sites.id, workOrders.siteId)).innerJoin(checklistTemplateVersions, eq(checklistTemplateVersions.id, workOrders.templateVersionId)).innerJoin(checklistTemplates, eq(checklistTemplates.id, checklistTemplateVersions.templateId)).leftJoin(teams, eq(teams.id, workOrders.teamId)).where(workOrderTenantPredicate(organizationId, id)).limit(1);
  if (!row) return null;
  const [assignees, history] = await Promise.all([
    db.select({ membershipId: memberships.id, name: users.name, email: users.email }).from(workOrderAssignments).innerJoin(memberships, eq(memberships.id, workOrderAssignments.membershipId)).innerJoin(users, eq(users.id, memberships.userId)).where(eq(workOrderAssignments.workOrderId, id)),
    db.select({ history: workOrderStatusHistory, actorName: users.name }).from(workOrderStatusHistory).leftJoin(users, eq(users.id, workOrderStatusHistory.actorId)).where(and(eq(workOrderStatusHistory.organizationId, organizationId), eq(workOrderStatusHistory.workOrderId, id))).orderBy(desc(workOrderStatusHistory.createdAt)),
  ]);
  return { ...row, assignees, history };
}

export async function getWorkOrderFormOptions(organizationId: string) {
  const db = getDatabase();
  const [clientRows, siteRows, templateRows, teamRows, memberRows] = await Promise.all([
    db.select({ id: clients.id, name: clients.name }).from(clients).where(and(eq(clients.organizationId, organizationId), isNull(clients.archivedAt))).orderBy(asc(clients.name)),
    db.select({ id: sites.id, clientId: sites.clientId, name: sites.name }).from(sites).where(and(eq(sites.organizationId, organizationId), isNull(sites.archivedAt))).orderBy(asc(sites.name)),
    db.select({ id: checklistTemplateVersions.id, version: checklistTemplateVersions.version, templateName: checklistTemplates.name }).from(checklistTemplateVersions).innerJoin(checklistTemplates, eq(checklistTemplates.id, checklistTemplateVersions.templateId)).where(and(eq(checklistTemplateVersions.organizationId, organizationId), isNull(checklistTemplates.archivedAt))).orderBy(asc(checklistTemplates.name), desc(checklistTemplateVersions.version)),
    db.select({ id: teams.id, name: teams.name }).from(teams).where(and(eq(teams.organizationId, organizationId), isNull(teams.archivedAt))).orderBy(asc(teams.name)),
    db.select({ id: memberships.id, name: users.name, role: memberships.role }).from(memberships).innerJoin(users, eq(users.id, memberships.userId)).where(and(eq(memberships.organizationId, organizationId), eq(memberships.status, "ACTIVE"))).orderBy(asc(users.name)),
  ]);
  return { clients: clientRows, sites: siteRows, templates: templateRows, teams: teamRows, members: memberRows };
}

export async function listScheduledWorkOrders(organizationId: string, from: Date, to: Date) {
  return getDatabase().select({ workOrder: workOrders, clientName: clients.name, siteName: sites.name }).from(workOrders).innerJoin(clients, eq(clients.id, workOrders.clientId)).innerJoin(sites, eq(sites.id, workOrders.siteId)).where(and(eq(workOrders.organizationId, organizationId), gte(workOrders.scheduleStart, from), lte(workOrders.scheduleStart, to))).orderBy(asc(workOrders.scheduleStart));
}

export async function getWorkOrderDashboardStats(organizationId:string){const db=getDatabase();const now=new Date();const start=new Date(now.getFullYear(),now.getMonth(),now.getDate());const end=new Date(start.getTime()+24*60*60*1_000);const[grouped,today,overdue,recent]=await Promise.all([db.select({status:workOrders.status,value:count()}).from(workOrders).where(eq(workOrders.organizationId,organizationId)).groupBy(workOrders.status),db.select({value:count()}).from(workOrders).where(and(eq(workOrders.organizationId,organizationId),gte(workOrders.scheduleStart,start),lt(workOrders.scheduleStart,end))),db.select({value:count()}).from(workOrders).where(and(eq(workOrders.organizationId,organizationId),lt(workOrders.dueDate,now),notInArray(workOrders.status,["COMPLETED","CANCELLED"]))),db.select({id:workOrders.id,number:workOrders.number,title:workOrders.title,status:workOrders.status,updatedAt:workOrders.updatedAt}).from(workOrders).where(eq(workOrders.organizationId,organizationId)).orderBy(desc(workOrders.updatedAt)).limit(5)]);return{byStatus:Object.fromEntries(grouped.map((item)=>[item.status,item.value])) as Partial<Record<WorkOrderStatus,number>>,today:today[0]?.value??0,overdue:overdue[0]?.value??0,recent};}

export async function updateWorkOrder(organizationId: string, actorId: string, id: string, expectedRowVersion: number, input: WorkOrderInput) {
  const result = await getDatabase().transaction(async (tx) => {
    const [before] = await tx.select().from(workOrders).where(and(workOrderTenantPredicate(organizationId, id), eq(workOrders.rowVersion, expectedRowVersion))).limit(1);
    if (!before) throw new WorkOrderConflictError("Work order berubah di sesi lain.");
    if (!["DRAFT", "SCHEDULED", "ASSIGNED"].includes(before.status)) throw new WorkOrderConflictError("Work order tidak dapat diedit setelah pekerjaan dimulai.");
    await validateReferences(tx, organizationId, input);
    const nextStatus = derivePlanningStatus({ hasSchedule: Boolean(input.scheduleStart), assigneeCount: input.assigneeIds.length });
    if (nextStatus !== before.status) assertWorkOrderTransition(before.status, nextStatus);
    const [updated] = await tx.update(workOrders).set({ ...databaseValues(input), status: nextStatus, rowVersion: expectedRowVersion+1, updatedAt: new Date(), recurrenceSeriesId: input.recurrenceFrequency ? before.recurrenceSeriesId ?? crypto.randomUUID() : null, recurrenceOccurrenceAt: input.recurrenceFrequency ? input.scheduleStart : null }).where(and(workOrderTenantPredicate(organizationId,id),eq(workOrders.rowVersion,expectedRowVersion))).returning();
    if (!updated) throw new WorkOrderConflictError("Work order berubah di sesi lain.");
    const previousAssignments = await tx.select({ membershipId: workOrderAssignments.membershipId }).from(workOrderAssignments).where(eq(workOrderAssignments.workOrderId,id));
    await tx.delete(workOrderAssignments).where(eq(workOrderAssignments.workOrderId,id));
    if(input.assigneeIds.length) await tx.insert(workOrderAssignments).values([...new Set(input.assigneeIds)].map((membershipId)=>({workOrderId:id,membershipId,assignedById:actorId})));
    if(nextStatus!==before.status) await tx.insert(workOrderStatusHistory).values({organizationId,workOrderId:id,fromStatus:before.status,toStatus:nextStatus,actorId,reason:"Planning details updated"});
    await tx.insert(auditLogs).values({organizationId,actorId,action:"WORK_ORDER_UPDATED",resourceType:"WORK_ORDER",resourceId:id,beforeSummary:{status:before.status,scheduleStart:before.scheduleStart},afterSummary:{status:nextStatus,scheduleStart:updated.scheduleStart}});
    const previousIds=new Set(previousAssignments.map((item)=>item.membershipId)); return { updated, newAssigneeIds: input.assigneeIds.filter((item)=>!previousIds.has(item)), scheduleChanged: before.scheduleStart?.getTime()!==updated.scheduleStart?.getTime() || before.scheduleEnd?.getTime()!==updated.scheduleEnd?.getTime() };
  });
  if(result.newAssigneeIds.length) await createNotifications({organizationId,membershipIds:result.newAssigneeIds,type:"WORK_ORDER_ASSIGNED",title:`Assignment baru: ${result.updated.number}`,body:result.updated.title,resourceId:id,href:`/app/work-orders/${id}`});
  if(result.scheduleChanged && input.assigneeIds.length) await createNotifications({organizationId,membershipIds:input.assigneeIds,type:"WORK_ORDER_SCHEDULE_CHANGED",title:`Jadwal berubah: ${result.updated.number}`,body:result.updated.title,resourceId:id,href:`/app/work-orders/${id}`});
  await scheduleNextRecurrence(result.updated); return result.updated;
}

export async function cancelWorkOrder(organizationId:string,actorId:string,id:string,reason:string){
  return transitionWorkOrderStatus(organizationId,actorId,id,"CANCELLED",reason);
}

export async function transitionWorkOrderStatus(organizationId:string,actorId:string,id:string,toStatus:WorkOrderStatus,reason?:string){
  const result=await getDatabase().transaction(async(tx)=>{const [before]=await tx.select().from(workOrders).where(workOrderTenantPredicate(organizationId,id)).limit(1);if(!before)throw new WorkOrderReferenceError("Work order tidak ditemukan.");assertWorkOrderTransition(before.status,toStatus,reason);const [updated]=await tx.update(workOrders).set({status:toStatus,cancellationReason:toStatus==="CANCELLED"?reason:null,rowVersion:before.rowVersion+1,updatedAt:new Date()}).where(and(workOrderTenantPredicate(organizationId,id),eq(workOrders.rowVersion,before.rowVersion))).returning();if(!updated)throw new WorkOrderConflictError("Work order berubah ketika status diperbarui.");await tx.insert(workOrderStatusHistory).values({organizationId,workOrderId:id,fromStatus:before.status,toStatus,reason,actorId});await tx.insert(auditLogs).values({organizationId,actorId,action:"WORK_ORDER_STATUS_TRANSITIONED",resourceType:"WORK_ORDER",resourceId:id,beforeSummary:{status:before.status},afterSummary:{status:toStatus,reason}});const assignments=await tx.select({membershipId:workOrderAssignments.membershipId}).from(workOrderAssignments).where(eq(workOrderAssignments.workOrderId,id));return{updated,membershipIds:[...assignments.map((item)=>item.membershipId),...(before.supervisorMembershipId?[before.supervisorMembershipId]:[])]};});await createNotifications({organizationId,membershipIds:result.membershipIds,type:"WORK_ORDER_STATUS_CHANGED",title:`Status ${result.updated.number}: ${toStatus.replaceAll("_"," ")}`,body:reason||result.updated.title,resourceId:id,href:`/app/work-orders/${id}`});return result.updated;
}

export async function bulkAssignWorkOrders(organizationId:string,actorId:string,workOrderIds:string[],membershipId:string){
  const db=getDatabase();const [member]=await db.select({id:memberships.id}).from(memberships).where(and(eq(memberships.organizationId,organizationId),eq(memberships.id,membershipId),eq(memberships.status,"ACTIVE"))).limit(1);if(!member)throw new WorkOrderReferenceError("Assignee tidak valid.");const assigned:string[]=[];
  for(const id of [...new Set(workOrderIds)]) await db.transaction(async(tx)=>{const [row]=await tx.select().from(workOrders).where(workOrderTenantPredicate(organizationId,id)).limit(1);if(!row||!["DRAFT","SCHEDULED","ASSIGNED"].includes(row.status))return;const [newAssignment]=await tx.insert(workOrderAssignments).values({workOrderId:id,membershipId,assignedById:actorId}).onConflictDoNothing().returning({membershipId:workOrderAssignments.membershipId});if(!newAssignment)return;if(row.status!=="ASSIGNED"){assertWorkOrderTransition(row.status,"ASSIGNED");await tx.update(workOrders).set({status:"ASSIGNED",rowVersion:row.rowVersion+1,updatedAt:new Date()}).where(workOrderTenantPredicate(organizationId,id));await tx.insert(workOrderStatusHistory).values({organizationId,workOrderId:id,fromStatus:row.status,toStatus:"ASSIGNED",actorId,reason:"Bulk assignment"});}await tx.insert(auditLogs).values({organizationId,actorId,action:"WORK_ORDER_ASSIGNED",resourceType:"WORK_ORDER",resourceId:id,metadata:{membershipId,bulk:true}});assigned.push(id);});
  for(const id of assigned) await createNotifications({organizationId,membershipIds:[membershipId],type:"WORK_ORDER_ASSIGNED",title:"Work order baru ditugaskan",body:"Buka FieldProof untuk melihat detail tugas.",resourceId:id,href:`/app/work-orders/${id}`});return assigned.length;
}

export async function duplicateWorkOrder(organizationId:string,actorId:string,id:string){const source=await getWorkOrder(organizationId,id);if(!source)return null;const work=source.workOrder;return createWorkOrder(organizationId,actorId,{title:`${work.title} (Copy)`,description:work.description??undefined,clientId:work.clientId,siteId:work.siteId,templateVersionId:work.templateVersionId,priority:work.priority,scheduleStart:undefined,scheduleEnd:undefined,dueDate:undefined,teamId:work.teamId??undefined,supervisorMembershipId:work.supervisorMembershipId??undefined,internalNotes:work.internalNotes??undefined,instructions:work.instructions??undefined,tags:work.tags,clientVisibility:work.clientVisibility,clientApprovalRequired:work.clientApprovalRequired,recurrenceFrequency:undefined,recurrenceInterval:1,recurrenceEndAt:undefined,assigneeIds:[]});}

export async function generateRecurringWorkOrder(sourceWorkOrderId:string,occurrenceAt:Date){
  const db=getDatabase();
  const [source]=await db.select().from(workOrders).where(eq(workOrders.id,sourceWorkOrderId)).limit(1);
  if(!source?.recurrenceFrequency||!source.recurrenceSeriesId||!source.scheduleStart)return null;
  const expected=nextOccurrence(source.scheduleStart,source.recurrenceFrequency,source.recurrenceInterval??1);
  if(expected.getTime()!==occurrenceAt.getTime()||(source.recurrenceEndAt&&occurrenceAt>source.recurrenceEndAt))return null;
  const duration=source.scheduleEnd?source.scheduleEnd.getTime()-source.scheduleStart.getTime():null;
  const dueOffset=source.dueDate?source.dueDate.getTime()-source.scheduleStart.getTime():null;
  const result=await db.transaction(async(tx)=>{
    const assignments=await tx.select({membershipId:workOrderAssignments.membershipId}).from(workOrderAssignments).where(eq(workOrderAssignments.workOrderId,source.id));
    const status=derivePlanningStatus({hasSchedule:true,assigneeCount:assignments.length});
    const [created]=await tx.insert(workOrders).values({...source,id:undefined,number:workOrderNumber(),status,scheduleStart:occurrenceAt,scheduleEnd:duration!==null?new Date(occurrenceAt.getTime()+duration):null,dueDate:dueOffset!==null?new Date(occurrenceAt.getTime()+dueOffset):null,recurrenceOccurrenceAt:occurrenceAt,cancellationReason:null,createdAt:new Date(),updatedAt:new Date(),rowVersion:1}).onConflictDoNothing().returning();
    if(!created)return null;
    if(assignments.length)await tx.insert(workOrderAssignments).values(assignments.map((item)=>({workOrderId:created.id,membershipId:item.membershipId,assignedById:source.createdById})));
    await tx.insert(workOrderStatusHistory).values({organizationId:source.organizationId,workOrderId:created.id,toStatus:status,actorId:source.createdById,reason:"Recurring instance generated"});
    await tx.insert(auditLogs).values({organizationId:source.organizationId,actorId:source.createdById,action:"RECURRING_WORK_ORDER_GENERATED",resourceType:"WORK_ORDER",resourceId:created.id,metadata:{seriesId:source.recurrenceSeriesId,sourceWorkOrderId:source.id}});
    return {created,assignmentIds:assignments.map((item)=>item.membershipId)};
  });
  if(!result){
    const [existing]=await db.select().from(workOrders).where(and(eq(workOrders.organizationId,source.organizationId),eq(workOrders.recurrenceSeriesId,source.recurrenceSeriesId),eq(workOrders.recurrenceOccurrenceAt,occurrenceAt))).limit(1);
    if(existing)await scheduleNextRecurrence(existing);
    return existing??null;
  }
  await createNotifications({organizationId:source.organizationId,membershipIds:result.assignmentIds,type:"WORK_ORDER_ASSIGNED",title:`Recurring assignment: ${result.created.number}`,body:result.created.title,resourceId:result.created.id,href:`/app/work-orders/${result.created.id}`});
  await scheduleNextRecurrence(result.created);
  return result.created;
}

export async function createDueSoonNotifications(now=new Date()){const until=new Date(now.getTime()+24*60*60*1_000);const db=getDatabase();const rows=await db.select({workOrder:workOrders,membershipId:workOrderAssignments.membershipId}).from(workOrders).innerJoin(workOrderAssignments,eq(workOrderAssignments.workOrderId,workOrders.id)).where(and(gte(workOrders.dueDate,now),lte(workOrders.dueDate,until),inArray(workOrders.status,["SCHEDULED","ASSIGNED","IN_PROGRESS","REVISION_REQUIRED"])));let created=0;for(const row of rows){const [existing]=await db.select({id:notifications.id}).from(notifications).where(and(eq(notifications.recipientMembershipId,row.membershipId),eq(notifications.type,"WORK_ORDER_DUE_SOON"),eq(notifications.resourceId,row.workOrder.id))).limit(1);if(existing)continue;await createNotifications({organizationId:row.workOrder.organizationId,membershipIds:[row.membershipId],type:"WORK_ORDER_DUE_SOON",title:`Hampir jatuh tempo: ${row.workOrder.number}`,body:row.workOrder.title,resourceId:row.workOrder.id,href:`/app/work-orders/${row.workOrder.id}`});created++;}return created;}
