"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { archiveClient, createClient, setClientReviewer, updateClient } from "@/modules/clients/service";
import { clientInputSchema } from "@/modules/clients/validation";
import { cancelInvitation, resendInvitation } from "@/modules/invitations/service";
import { assertPermission } from "@/modules/memberships/permissions";
import { setMemberSuspended, transferOwnership, updateMemberRole } from "@/modules/memberships/service";
import { updateOrganizationSettings } from "@/modules/organizations/settings-service";
import { organizationSettingsSchema } from "@/modules/organizations/settings-validation";
import { archiveSite, createSite, updateSite } from "@/modules/sites/service";
import { siteInputSchema } from "@/modules/sites/validation";
import { archiveTeam, createTeam, updateTeam } from "@/modules/teams/service";
import { teamInputSchema } from "@/modules/teams/validation";
import { requireTenantContext } from "@/server/auth/tenant";

const idSchema = z.uuid();

export async function createClientAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "client:manage");
  const input = clientInputSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect("/app/clients?error=invalid");
  const row = await createClient(tenant.organizationId, tenant.userId, input.data);
  redirect(`/app/clients/${row.id}`);
}

export async function updateClientAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "client:manage");
  const id = idSchema.parse(formData.get("id")); const input = clientInputSchema.parse(Object.fromEntries(formData));
  await updateClient(tenant.organizationId, tenant.userId, id, input); revalidatePath(`/app/clients/${id}`);
}

export async function archiveClientAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "client:manage");
  await archiveClient(tenant.organizationId, tenant.userId, idSchema.parse(formData.get("id"))); redirect("/app/clients");
}

export async function clientReviewerAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "client:manage");
  const clientId = idSchema.parse(formData.get("clientId")); const membershipId = idSchema.parse(formData.get("membershipId"));
  await setClientReviewer(tenant.organizationId, tenant.userId, clientId, membershipId, formData.get("intent") === "assign");
  revalidatePath(`/app/clients/${clientId}`);
}

function siteFormInput(formData: FormData) {
  return siteInputSchema.parse(Object.fromEntries(formData));
}

export async function createSiteAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "site:manage");
  const row = await createSite(tenant.organizationId, tenant.userId, siteFormInput(formData)); redirect(`/app/sites/${row.id}`);
}

export async function updateSiteAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "site:manage");
  const id = idSchema.parse(formData.get("id")); await updateSite(tenant.organizationId, tenant.userId, id, siteFormInput(formData)); revalidatePath(`/app/sites/${id}`);
}

export async function archiveSiteAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "site:manage");
  await archiveSite(tenant.organizationId, tenant.userId, idSchema.parse(formData.get("id"))); redirect("/app/sites");
}

export async function createTeamAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "membership:manage");
  const input = teamInputSchema.parse({ ...Object.fromEntries(formData), memberIds: formData.getAll("memberIds") });
  await createTeam(tenant.organizationId, tenant.userId, { ...input, supervisorMembershipId: input.supervisorMembershipId || undefined }); revalidatePath("/app/teams");
}

export async function archiveTeamAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "membership:manage");
  await archiveTeam(tenant.organizationId, tenant.userId, idSchema.parse(formData.get("id"))); revalidatePath("/app/teams");
}

export async function updateTeamAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "membership:manage");
  const id = idSchema.parse(formData.get("id"));
  const input = teamInputSchema.parse({ ...Object.fromEntries(formData), memberIds: formData.getAll("memberIds") });
  await updateTeam(tenant.organizationId, tenant.userId, id, { ...input, supervisorMembershipId: input.supervisorMembershipId || undefined }); revalidatePath("/app/teams");
}

export async function updateMemberAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "membership:manage");
  const membershipId = idSchema.parse(formData.get("membershipId"));
  const role = z.enum(["ADMIN", "SUPERVISOR", "FIELD_WORKER", "CLIENT_REVIEWER", "AUDITOR"]).parse(formData.get("role"));
  await updateMemberRole(tenant.organizationId, tenant.userId, membershipId, role); revalidatePath("/app/members");
}

export async function suspendMemberAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "membership:manage");
  await setMemberSuspended(tenant.organizationId, tenant.userId, idSchema.parse(formData.get("membershipId")), formData.get("suspended") === "true"); revalidatePath("/app/members");
}

export async function transferOwnershipAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "organization:manage");
  await transferOwnership(tenant.organizationId, tenant.userId, idSchema.parse(formData.get("membershipId"))); redirect("/app/dashboard");
}

export async function invitationAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "membership:manage");
  const id = idSchema.parse(formData.get("invitationId"));
  if (formData.get("intent") === "resend") await resendInvitation(tenant.organizationId, tenant.userId, id); else await cancelInvitation(tenant.organizationId, tenant.userId, id);
  revalidatePath("/app/members");
}

export async function updateOrganizationSettingsAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "organization:manage");
  const input = organizationSettingsSchema.parse(Object.fromEntries(formData));
  await updateOrganizationSettings(tenant.organizationId, tenant.userId, input); revalidatePath("/app/settings/organization");
}
