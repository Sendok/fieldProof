import { locationSchema } from "@/modules/execution/validation";
import { startWorkOrder } from "@/modules/execution/service";
import { assertPermission } from "@/modules/memberships/permissions";
import { requireTenantContext } from "@/server/auth/tenant";
import { assertSameOrigin } from "@/server/security/origin";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{assertSameOrigin(request);const[tenant,route,body]=await Promise.all([requireTenantContext(),params,request.json().catch(()=>({}))]);assertPermission(tenant.role,"work_order:execute");const location=body.location?locationSchema.parse(body.location):undefined;const row=await startWorkOrder(tenant.organizationId,tenant.membershipId,tenant.userId,route.id,location);return Response.json({status:row.status,startedAt:row.actualStartedAt});}catch(error){return Response.json({error:error instanceof Error?error.message:"START_FAILED"},{status:403});}}
