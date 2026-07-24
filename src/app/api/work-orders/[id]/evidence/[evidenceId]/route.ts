import { deleteEvidence } from "@/modules/evidence/service";
import { assertPermission } from "@/modules/memberships/permissions";
import { requireTenantContext } from "@/server/auth/tenant";
import { assertSameOrigin } from "@/server/security/origin";
export async function DELETE(request:Request,{params}:{params:Promise<{id:string;evidenceId:string}>}){try{assertSameOrigin(request);const[tenant,route]=await Promise.all([requireTenantContext(),params]);assertPermission(tenant.role,"work_order:execute");await deleteEvidence(tenant.organizationId,tenant.membershipId,route.id,route.evidenceId);return new Response(null,{status:204});}catch(error){return Response.json({error:error instanceof Error?error.message:"EVIDENCE_DELETE_FAILED"},{status:400});}}
