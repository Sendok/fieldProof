"use server";

import { redirect } from "next/navigation";
import { acceptInvitation } from "@/modules/invitations/service";
import { auth } from "@/server/auth";

export async function acceptInvitationAction(formData: FormData): Promise<void> {
  const session = await auth();
  const token = formData.get("token");
  if (!session?.user.id) redirect("/login");
  if (typeof token !== "string" || !(await acceptInvitation(token, session.user.id))) redirect(`/invitation/${String(token)}?error=invalid`);
  redirect("/app/dashboard");
}
