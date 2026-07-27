import { prepareEvidenceUpload } from "@/modules/evidence/service";
import { assertPermission } from "@/modules/memberships/permissions";
import { requireTenantContext } from "@/server/auth/tenant";
import { assertSameOrigin } from "@/server/security/origin";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{assertSameOrigin(request);const[tenant,route,body]=await Promise.all([requireTenantContext(),params,request.json()]);assertPermission(tenant.role,"work_order:execute");if(tenant.role==="FIELD_WORKER"&&(typeof body.latitude!=="number"||typeof body.longitude!=="number"))throw new Error("GPS_REQUIRED_FOR_EVIDENCE");return Response.json(await prepareEvidenceUpload(tenant.organizationId,tenant.membershipId,route.id,body));}catch(error){return Response.json({error:error instanceof Error?error.message:"PRESIGN_FAILED"},{status:400});}}
