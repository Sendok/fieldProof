import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/forms/master-data";
import { TemplatePreview } from "@/components/templates/template-preview";
import { hasPermission } from "@/modules/memberships/permissions";
import { getTemplate, getTemplateVersion } from "@/modules/templates/service";
import { requireTenantContext } from "@/server/auth/tenant";

export default async function PreviewPage({ params, searchParams }: { params: Promise<{id:string}>; searchParams: Promise<Record<string,string|undefined>> }) {
  const [tenant, route, query] = await Promise.all([requireTenantContext(),params,searchParams]); if(!hasPermission(tenant.role,"template:manage")) redirect("/app/dashboard");
  const template = await getTemplate(tenant.organizationId,route.id); if(!template) notFound(); const versionNumber = Number(query.version); const version = Number.isInteger(versionNumber)&&versionNumber>0?await getTemplateVersion(tenant.organizationId,template.id,versionNumber):null; if(query.version&&!version) notFound();
  const mode = query.mode === "report" ? "report" : "mobile";
  return <main><PageHeader eyebrow="Preview" title={template.name} description={version?`Snapshot immutable v${version.version}`:"Draft aktif (belum immutable)"}/><div className="my-5 flex flex-wrap gap-2"><Link href={`/app/templates/${template.id}/builder`} className="min-h-11 rounded-xl border bg-white px-4 py-3 text-sm font-bold">Kembali ke builder</Link><Link href={`?${version?`version=${version.version}&`:""}mode=mobile`} className="min-h-11 rounded-xl border bg-white px-4 py-3 text-sm font-bold">Mobile worker</Link><Link href={`?${version?`version=${version.version}&`:""}mode=report`} className="min-h-11 rounded-xl border bg-white px-4 py-3 text-sm font-bold">PDF/report</Link></div><TemplatePreview schema={version?.schemaSnapshot??template.draftSchema} mode={mode}/></main>;
}
