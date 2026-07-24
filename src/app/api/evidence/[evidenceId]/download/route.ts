import { getEvidenceDownload } from "@/modules/evidence/service";
import { requireTenantContext } from "@/server/auth/tenant";
export async function GET(_:Request,{params}:{params:Promise<{evidenceId:string}>}){try{const[tenant,route]=await Promise.all([requireTenantContext(),params]);return Response.redirect(await getEvidenceDownload(tenant.organizationId,tenant.membershipId,tenant.role,route.evidenceId),302);}catch{return new Response("Not found",{status:404});}}
