import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { FormField, PageHeader, Submit, inputClass } from "@/components/forms/master-data";
import { hasPermission } from "@/modules/memberships/permissions";
import { listOrganizationMembers } from "@/modules/memberships/service";
import { listTeams } from "@/modules/teams/service";
import { requireTenantContext } from "@/server/auth/tenant";
import { getDatabase } from "@/server/db/client";
import { teamMembers, teams } from "@/server/db/schema";
import { archiveTeamAction, createTeamAction, updateTeamAction } from "../master-data-actions";

export default async function TeamsPage() {
  const tenant = await requireTenantContext();
  if (!hasPermission(tenant.role, "membership:manage")) redirect("/app/dashboard");

  const [teamData, members, assignments] = await Promise.all([
    listTeams(tenant.organizationId),
    listOrganizationMembers(tenant.organizationId),
    getDatabase().select({ teamId: teamMembers.teamId, membershipId: teamMembers.membershipId }).from(teamMembers).innerJoin(teams, eq(teams.id, teamMembers.teamId)).where(eq(teams.organizationId, tenant.organizationId)),
  ]);
  const activeMembers = members.filter((member) => member.status === "ACTIVE");
  const supervisors = activeMembers.filter((member) => member.role === "SUPERVISOR" || member.role === "OWNER");

  return <main><PageHeader eyebrow="Operations" title="Teams" description="Kelompokkan anggota berdasarkan supervisor dan area operasional." />
    <details className="mt-6 rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-extrabold text-coral-700">+ Buat team</summary><form action={createTeamAction} className="mt-5 grid gap-4 sm:grid-cols-2"><FormField label="Nama team" name="name" required /><FormField label="Area/site assignment" name="area" /><label className="text-sm font-bold sm:col-span-2">Supervisor<select name="supervisorMembershipId" className={inputClass}><option value="">Tanpa supervisor</option>{supervisors.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label><fieldset className="sm:col-span-2"><legend className="text-sm font-bold">Anggota</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{activeMembers.map((member) => <label key={member.id} className="flex min-h-11 items-center gap-3 rounded-xl border px-3"><input type="checkbox" name="memberIds" value={member.id} /><span className="text-sm font-semibold">{member.name} · {member.role}</span></label>)}</div></fieldset><div className="sm:col-span-2"><Submit>Simpan team</Submit></div></form></details>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">{teamData.rows.length ? teamData.rows.map((team) => <article key={team.id} className="rounded-2xl border bg-white p-5"><div className="flex justify-between gap-4"><div><h2 className="font-extrabold">{team.name}</h2><p className="mt-1 text-sm text-ink-soft">{team.area || "Semua area"} · {team.memberCount} anggota</p><p className="mt-1 text-sm text-muted">Supervisor: {team.supervisorName || "Belum ditentukan"}</p></div><form action={archiveTeamAction}><input type="hidden" name="id" value={team.id} /><button className="text-sm font-bold text-danger">Archive</button></form></div><details className="mt-4 border-t pt-4"><summary className="cursor-pointer text-sm font-bold text-coral-700">Edit team</summary><form action={updateTeamAction} className="mt-4 space-y-3"><input type="hidden" name="id" value={team.id} /><FormField label="Nama" name="name" defaultValue={team.name} required /><FormField label="Area" name="area" defaultValue={team.area} /><label className="text-sm font-bold">Supervisor<select name="supervisorMembershipId" defaultValue={team.supervisorMembershipId ?? ""} className={inputClass}><option value="">Tanpa supervisor</option>{supervisors.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label><div className="grid gap-2">{activeMembers.map((member) => <label key={member.id} className="flex gap-2 text-sm"><input type="checkbox" name="memberIds" value={member.id} defaultChecked={assignments.some((assignment) => assignment.teamId === team.id && assignment.membershipId === member.id)} />{member.name}</label>)}</div><Submit>Update team</Submit></form></details></article>) : <div className="rounded-2xl border border-dashed p-8 text-center text-ink-soft sm:col-span-2">Belum ada team.</div>}</div>
  </main>;
}
