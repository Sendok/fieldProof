import { completeEvidenceUpload } from "@/modules/evidence/service";
import { assertPermission } from "@/modules/memberships/permissions";
import { requireTenantContext } from "@/server/auth/tenant";
import { assertSameOrigin } from "@/server/security/origin";
export async function POST(request:Request,{params}:{params:Promise<{id:string;evidenceId:string}>}){try{assertSameOrigin(request);const[tenant,route,body]=await Promise.all([requireTenantContext(),params,request.json()]);assertPermission(tenant.role,"work_order:execute");return Response.json(await completeEvidenceUpload(tenant.organizationId,tenant.membershipId,route.id,route.evidenceId,body));}catch(error){return Response.json({error:error instanceof Error?error.message:"EVIDENCE_COMPLETE_FAILED"},{status:400});}}
