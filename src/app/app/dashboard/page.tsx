import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireTenantContext } from "@/server/auth/tenant";
import { getDatabase } from "@/server/db/client";
import { memberships, organizations } from "@/server/db/schema";
import Link from "next/link";
import { hasPermission } from "@/modules/memberships/permissions";
import { getWorkOrderDashboardStats } from "@/modules/work-orders/service";
import { StatusBadge } from "@/components/work-orders/status-badge";
import { switchOrganizationAction } from "../actions";

export default async function DashboardPage() {
  let tenant;
  try { tenant = await requireTenantContext(); } catch (error) { if (error instanceof Error && error.message === "ORGANIZATION_REQUIRED") redirect("/app/onboarding"); throw error; }
  if (tenant.role === "FIELD_WORKER") redirect("/app/my-tasks/today");
  const db = getDatabase();
  const [organization] = await db.select().from(organizations).where(eq(organizations.id, tenant.organizationId)).limit(1);
  const available = await db.select({ id: organizations.id, name: organizations.name }).from(memberships).innerJoin(organizations, eq(organizations.id, memberships.organizationId)).where(and(eq(memberships.userId, tenant.userId), eq(memberships.status, "ACTIVE")));
  const stats=hasPermission(tenant.role,"work_order:manage")?await getWorkOrderDashboardStats(tenant.organizationId):null;
  return <main><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-bold uppercase tracking-wider text-coral-700">Organization dashboard</p><h1 className="mt-1 text-3xl font-extrabold text-ink">{organization?.name}</h1><p className="mt-2 text-ink-soft">Role aktif: {tenant.role}</p></div><form action={switchOrganizationAction}><label className="text-sm font-bold">Ganti organisasi<select name="organizationId" defaultValue={tenant.organizationId} className="ml-3 min-h-11 rounded-xl border bg-white px-3">{available.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label><button className="ml-2 min-h-11 rounded-xl bg-coral-600 px-4 font-bold text-white">Terapkan</button></form></div>{stats?<><section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Pekerjaan hari ini",stats.today,""],["Belum dimulai",(stats.byStatus.SCHEDULED??0)+(stats.byStatus.ASSIGNED??0),"SCHEDULED"],["Sedang berjalan",stats.byStatus.IN_PROGRESS??0,"IN_PROGRESS"],["Terlambat",stats.overdue,""]].map(([label,value,status])=><Link href={`/app/work-orders${status?`?status=${status}`:""}`} key={String(label)} className="rounded-2xl border bg-white p-5 hover:border-coral-300"><p className="text-sm font-bold text-muted">{label}</p><p className="mt-2 text-3xl font-extrabold text-ink">{value}</p></Link>)}</section><section className="mt-7"><div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Pekerjaan terbaru</h2><Link href="/app/work-orders" className="text-sm font-bold text-coral-700">Lihat semua</Link></div><div className="mt-3 space-y-2">{stats.recent.map((item)=><Link href={`/app/work-orders/${item.id}`} key={item.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-4"><div><p className="font-bold">{item.title}</p><p className="text-xs text-muted">{item.number}</p></div><StatusBadge status={item.status}/></Link>)}</div></section></>:<section className="mt-8 rounded-2xl border bg-white p-6"><p className="font-extrabold">FieldProof siap digunakan</p><p className="mt-2 text-sm text-ink-soft">Buka menu sesuai role Anda untuk melanjutkan pekerjaan.</p></section>}</main>;
}
