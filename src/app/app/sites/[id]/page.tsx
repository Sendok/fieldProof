import { and, asc, eq, isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { PageHeader, Submit } from "@/components/forms/master-data";
import { SiteForm } from "@/components/forms/site-form";
import { hasPermission } from "@/modules/memberships/permissions";
import { getSite } from "@/modules/sites/service";
import { requireTenantContext } from "@/server/auth/tenant";
import { getDatabase } from "@/server/db/client";
import { clients } from "@/server/db/schema";
import { archiveSiteAction, updateSiteAction } from "../../master-data-actions";

export default async function SiteDetailPage({params}:{params:Promise<{id:string}>}){const[tenant,{id}]=await Promise.all([requireTenantContext(),params]);if(!hasPermission(tenant.role,"site:manage"))redirect("/app/dashboard");const[site,clientOptions]=await Promise.all([getSite(tenant.organizationId,id),getDatabase().select({id:clients.id,name:clients.name}).from(clients).where(and(eq(clients.organizationId,tenant.organizationId),isNull(clients.archivedAt))).orderBy(asc(clients.name))]);if(!site)notFound();return <main><PageHeader eyebrow={site.code} title={site.name} description="Wilayah administratif Indonesia dan koordinat target disimpan untuk memastikan GPS worker tervalidasi sebelum mulai kerja."/><div className="mt-6 rounded-2xl border bg-white p-5"><SiteForm action={updateSiteAction} clients={clientOptions} site={site}/></div><form action={archiveSiteAction} className="mt-4"><input type="hidden" name="id" value={site.id}/><Submit danger>Archive site</Submit></form></main>}
