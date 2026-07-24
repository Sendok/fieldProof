import { and, asc, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/forms/master-data";
import { SiteForm } from "@/components/forms/site-form";
import { hasPermission } from "@/modules/memberships/permissions";
import { listSites } from "@/modules/sites/service";
import { requireTenantContext } from "@/server/auth/tenant";
import { getDatabase } from "@/server/db/client";
import { clients } from "@/server/db/schema";
import { createSiteAction } from "../master-data-actions";

export default async function SitesPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const[tenant,query]=await Promise.all([requireTenantContext(),searchParams]);if(!hasPermission(tenant.role,"site:manage"))redirect("/app/dashboard");const page=Math.max(1,Number(query.page)||1);const[clientOptions,data]=await Promise.all([getDatabase().select({id:clients.id,name:clients.name}).from(clients).where(and(eq(clients.organizationId,tenant.organizationId),isNull(clients.archivedAt))).orderBy(asc(clients.name)),listSites({organizationId:tenant.organizationId,search:query.search,page,pageSize:25})]);return <main><PageHeader eyebrow="Master data" title="Sites & locations" description="Alamat, akses, keselamatan, dan koordinat opsional untuk pelaksanaan kerja."/><details className="mt-6 rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-extrabold text-coral-700">+ Tambah site</summary><div className="mt-5"><SiteForm action={createSiteAction} clients={clientOptions}/></div></details><form className="mt-6 flex gap-3"><input name="search" defaultValue={query.search} placeholder="Cari site, client, atau code" className="min-h-11 flex-1 rounded-xl border bg-white px-4"/><button className="rounded-xl border bg-white px-5 font-bold">Cari</button></form><div className="mt-5 space-y-3">{data.rows.length?data.rows.map((site)=><Link key={site.id} href={`/app/sites/${site.id}`} className="flex justify-between rounded-2xl border bg-white p-5 hover:border-coral-300"><div><p className="font-extrabold">{site.name}</p><p className="mt-1 text-sm text-ink-soft">{site.code} · {site.clientName}</p><p className="mt-1 text-sm text-muted">{site.address}</p></div><span className="text-xs font-extrabold">{site.status}</span></Link>):<div className="rounded-2xl border border-dashed p-8 text-center text-ink-soft">Belum ada site.</div>}</div><p className="mt-5 text-sm font-semibold text-muted">{data.total} site · Halaman {page}</p></main>}
