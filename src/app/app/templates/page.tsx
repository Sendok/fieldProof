import Link from "next/link";
import { redirect } from "next/navigation";
import { Copy, Eye, Pencil } from "lucide-react";

import { FormField, PageHeader, Submit, TextAreaField, inputClass } from "@/components/forms/master-data";
import { hasPermission } from "@/modules/memberships/permissions";
import { listTemplates } from "@/modules/templates/service";
import { requireTenantContext } from "@/server/auth/tenant";
import { createTemplateAction, duplicateTemplateAction } from "../template-actions";

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [tenant, query] = await Promise.all([requireTenantContext(), searchParams]);
  if (!hasPermission(tenant.role, "template:manage")) redirect("/app/dashboard");
  const page = Math.max(1, Number(query.page) || 1); const data = await listTemplates({ organizationId: tenant.organizationId, search: query.search, page, pageSize: 25 });
  return <main><PageHeader eyebrow="Operations" title="Checklist templates" description="Susun checklist reusable, pratinjau pengalaman petugas, lalu publish sebagai versi immutable."/>
    <details className="mt-6 rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-extrabold text-coral-700">+ Buat template</summary><form action={createTemplateAction} className="mt-5 grid gap-4 sm:grid-cols-2"><FormField label="Nama template" name="name" required/><FormField label="Kategori" name="category"/><FormField label="Industri" name="industry"/><FormField label="Estimasi menit" name="estimatedMinutes" type="number"/><div className="sm:col-span-2"><TextAreaField label="Deskripsi" name="description"/></div><div className="sm:col-span-2"><Submit>Buka builder</Submit></div></form></details>
    <form className="mt-6 flex gap-3"><input name="search" defaultValue={query.search} placeholder="Cari nama, kategori, atau industri" className={`${inputClass} mt-0 flex-1`}/><button className="min-h-11 rounded-xl border bg-white px-5 font-bold">Cari</button></form>
    <div className="mt-5 grid gap-4 lg:grid-cols-2">{data.rows.map((template)=><article key={template.id} className="rounded-2xl border bg-white p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-coral-50 px-3 py-1 text-xs font-extrabold text-coral-700">{template.status}</span>{template.isBuiltIn?<span className="rounded-full bg-cream-100 px-3 py-1 text-xs font-extrabold">Built-in</span>:null}</div><h2 className="mt-3 text-lg font-extrabold">{template.name}</h2><p className="mt-1 text-sm text-ink-soft">{template.category || "Tanpa kategori"} · v{template.currentVersion}</p></div></div><div className="mt-5 flex flex-wrap gap-2"><Link href={`/app/templates/${template.id}/builder`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-coral-600 px-4 text-sm font-bold text-white"><Pencil className="size-4"/>Builder</Link><Link href={`/app/templates/${template.id}/preview`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold"><Eye className="size-4"/>Preview</Link><form action={duplicateTemplateAction}><input type="hidden" name="id" value={template.id}/><button className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold"><Copy className="size-4"/>Duplicate</button></form></div></article>)}{!data.rows.length?<div className="rounded-2xl border border-dashed p-8 text-center text-ink-soft lg:col-span-2">Belum ada template yang cocok.</div>:null}</div><p className="mt-5 text-sm font-semibold text-muted">Menampilkan {data.rows.length} dari {data.total} template · Halaman {page}</p>
  </main>;
}
