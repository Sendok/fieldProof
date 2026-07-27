import { redirect } from "next/navigation";

import { requireTenantContext } from "@/server/auth/tenant";

export default async function AppEntryPage() {
  try {
    const tenant = await requireTenantContext();
    redirect(tenant.role === "FIELD_WORKER" ? "/app/my-tasks/today" : "/app/dashboard");
  } catch (error) {
    if (error instanceof Error && error.message === "ORGANIZATION_REQUIRED") redirect("/app/onboarding");
    throw error;
  }
}
