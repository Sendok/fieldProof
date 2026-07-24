import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Archive, Eye, Rocket } from "lucide-react";

import { PageHeader } from "@/components/forms/master-data";
import { TemplateBuilder } from "@/components/templates/template-builder";
import { hasPermission } from "@/modules/memberships/permissions";
import { getTemplate, listTemplateVersions } from "@/modules/templates/service";
import { requireTenantContext } from "@/server/auth/tenant";
import { archiveTemplateAction, publishTemplateAction, saveTemplateAction } from "../../../template-actions";

export default async function BuilderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string,string|undefined>> }) {
  const [tenant, route, query] = await Promise.all([requireTenantContext(), params, searchParams]); if (!hasPermission(tenant.role,"template:manage")) redirect("/app/dashboard");
  const template = await getTemplate(tenant.organizationId, route.id); if (!template) notFound(); const versions = await listTemplateVersions(tenant.organizationId, route.id);
  return <main><PageHeader eyebrow="Template builder" title={template.name} description={`Draft aktif · versi terbit terbaru v${template.currentVersion}`}/>{query.saved?<p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-800">Draft tersimpan.</p>:null}{query.published?<p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-800">Versi baru berhasil dipublikasikan.</p>:null}
    <div className="mt-5 flex flex-wrap gap-2"><Link href={`/app/templates/${template.id}/preview`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold"><Eye className="size-4"/>Preview draft</Link><form action={publishTemplateAction}><input type="hidden" name="id" value={template.id}/><input type="hidden" name="rowVersion" value={template.rowVersion}/><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white"><Rocket className="size-4"/>Publish v{template.currentVersion+1}</button></form><form action={archiveTemplateAction}><input type="hidden" name="id" value={template.id}/><button className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold text-danger"><Archive className="size-4"/>Archive</button></form></div>
    {versions.length?<p className="mt-4 text-sm text-ink-soft">Versi immutable: {versions.map((version)=><Link key={version.id} className="ml-2 font-bold text-coral-700" href={`/app/templates/${template.id}/preview?version=${version.version}`}>v{version.version}</Link>)}</p>:null}
    <TemplateBuilder template={template} action={saveTemplateAction}/></main>;
}
