"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { assertPermission } from "@/modules/memberships/permissions";
import { archiveTemplate, createTemplate, duplicateTemplate, publishTemplate, saveTemplateDraft } from "@/modules/templates/service";
import { checklistSchema, templateMetadataSchema } from "@/modules/templates/validation";
import { requireTenantContext } from "@/server/auth/tenant";

const idSchema = z.uuid();

function metadata(formData: FormData) {
  const data = Object.fromEntries(formData);
  return templateMetadataSchema.parse({ ...data, estimatedMinutes: data.estimatedMinutes || undefined });
}

export async function createTemplateAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "template:manage");
  const row = await createTemplate(tenant.organizationId, tenant.userId, metadata(formData));
  redirect(`/app/templates/${row.id}/builder`);
}

export async function saveTemplateAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "template:manage");
  const id = idSchema.parse(formData.get("id"));
  const schema = checklistSchema.parse(JSON.parse(z.string().parse(formData.get("schema"))));
  await saveTemplateDraft(tenant.organizationId, tenant.userId, id, z.coerce.number().int().parse(formData.get("rowVersion")), { ...metadata(formData), schema });
  redirect(`/app/templates/${id}/builder?saved=1`);
}

export async function publishTemplateAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "template:manage");
  const id = idSchema.parse(formData.get("id"));
  await publishTemplate(tenant.organizationId, tenant.userId, id, z.coerce.number().int().parse(formData.get("rowVersion")));
  redirect(`/app/templates/${id}/builder?published=1`);
}

export async function duplicateTemplateAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "template:manage");
  const row = await duplicateTemplate(tenant.organizationId, tenant.userId, idSchema.parse(formData.get("id")));
  if (row) redirect(`/app/templates/${row.id}/builder`);
  redirect("/app/templates");
}

export async function archiveTemplateAction(formData: FormData): Promise<void> {
  const tenant = await requireTenantContext(); assertPermission(tenant.role, "template:manage");
  await archiveTemplate(tenant.organizationId, tenant.userId, idSchema.parse(formData.get("id")));
  revalidatePath("/app/templates"); redirect("/app/templates");
}
