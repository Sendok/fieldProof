import { NextResponse } from "next/server";
import { getOrganizationForTenant } from "@/modules/organizations/service";
import { requireTenantContext } from "@/server/auth/tenant";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const [tenant, { id }] = await Promise.all([requireTenantContext(), params]);
    const organization = await getOrganizationForTenant(tenant.organizationId, id);
    if (!organization) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Resource not found." } }, { status: 404 });
    return NextResponse.json({ data: organization });
  } catch {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 });
  }
}
