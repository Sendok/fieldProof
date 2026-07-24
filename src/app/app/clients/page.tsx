import Link from "next/link";
import { redirect } from "next/navigation";

import { FormField, PageHeader, Submit, TextAreaField, inputClass } from "@/components/forms/master-data";
import { listClients } from "@/modules/clients/service";
import { hasPermission } from "@/modules/memberships/permissions";
import { requireTenantContext } from "@/server/auth/tenant";
import { createClientAction } from "../master-data-actions";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [tenant, query] = await Promise.all([requireTenantContext(), searchParams]);
  if (!hasPermission(tenant.role, "client:manage")) redirect("/app/dashboard");
  const page = Math.max(1, Number(query.page) || 1); const pageSize = 25;
  const data = await listClients({ organizationId: tenant.organizationId, search: query.search, status: query.status === "ACTIVE" || query.status === "INACTIVE" ? query.status : undefined, page, pageSize });
  return <main><PageHeader eyebrow="Master data" title="Clients" description="Kelola perusahaan klien tanpa menghapus histori pekerjaan yang sudah ada." />
    <details className="mt-6 rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-extrabold text-coral-700">+ Tambah client</summary><form action={createClientAction} className="mt-5 grid gap-4 sm:grid-cols-2"><FormField label="Client code" name="code" required /><FormField label="Nama perusahaan" name="name" required /><FormField label="Contact person" name="contactPerson" /><FormField label="Email" name="email" type="email" /><FormField label="Telepon" name="phone" /><label className="text-sm font-bold">Status<select name="status" className={inputClass}><option>ACTIVE</option><option>INACTIVE</option></select></label><div className="sm:col-span-2"><TextAreaField label="Billing address" name="billingAddress" /></div><div className="sm:col-span-2"><TextAreaField label="Catatan" name="notes" /></div><div className="sm:col-span-2"><Submit>Simpan client</Submit></div></form></details>
    <form className="mt-6 flex flex-wrap gap-3"><input name="search" defaultValue={query.search} placeholder="Cari nama, code, atau kontak" className="min-h-11 flex-1 rounded-xl border bg-white px-4" /><select name="status" defaultValue={query.status ?? ""} className="min-h-11 rounded-xl border bg-white px-3"><option value="">Semua status</option><option>ACTIVE</option><option>INACTIVE</option></select><button className="min-h-11 rounded-xl border bg-white px-5 font-bold">Filter</button></form>
    <div className="mt-5 space-y-3">{data.rows.length ? data.rows.map((client)=><Link href={`/app/clients/${client.id}`} key={client.id} className="flex items-center justify-between rounded-2xl border bg-white p-5 transition hover:border-coral-300"><div><p className="font-extrabold text-ink">{client.name}</p><p className="mt-1 text-sm text-ink-soft">{client.code} · {client.contactPerson || "Belum ada contact person"}</p></div><span className="rounded-full bg-cream-100 px-3 py-1 text-xs font-extrabold">{client.status}</span></Link>) : <div className="rounded-2xl border border-dashed p-8 text-center text-ink-soft">Belum ada client yang cocok dengan filter.</div>}</div>
    <p className="mt-5 text-sm font-semibold text-muted">Menampilkan {data.rows.length} dari {data.total} client · Halaman {page}</p>
  </main>;
}
