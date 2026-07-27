import { locationSchema } from "@/modules/execution/validation";
import { startWorkOrder } from "@/modules/execution/service";
import { assertPermission } from "@/modules/memberships/permissions";
import { requireTenantContext } from "@/server/auth/tenant";
import { assertSameOrigin } from "@/server/security/origin";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{assertSameOrigin(request);const[tenant,route,body]=await Promise.all([requireTenantContext(),params,request.json().catch(()=>({}))]);assertPermission(tenant.role,"work_order:execute");const location=locationSchema.parse(body.location);const row=await startWorkOrder(tenant.organizationId,tenant.membershipId,tenant.userId,route.id,location);return Response.json({status:row.status,startedAt:row.actualStartedAt,startDistanceMeters:"startDistanceMeters" in row?row.startDistanceMeters:0});}catch(error){return Response.json({error:error instanceof Error?error.message:"START_FAILED"},{status:403});}}
