import { getRuntimeEnv } from "@/server/env";
export function assertSameOrigin(request:Request){const origin=request.headers.get("origin");if(origin&&origin!==new URL(getRuntimeEnv().APP_URL).origin)throw new Error("INVALID_ORIGIN");}
