import Link from "next/link";
import { AuthCard } from "@/components/forms/auth-card";
import { verifyEmail } from "@/modules/auth/service";
import { acceptInvitation } from "@/modules/invitations/service";
import { getDatabase } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const verified = Boolean(query.email && query.token && await verifyEmail(query.email, query.token));
  if (verified && query.invitation && query.email) {
    const [user] = await getDatabase().select({ id: users.id }).from(users).where(eq(users.email, query.email)).limit(1);
    if (user) await acceptInvitation(query.invitation, user.id);
  }
  return <AuthCard title={verified ? "Email terverifikasi" : "Tautan tidak valid"} description={verified ? "Akun Anda siap digunakan." : "Tautan mungkin sudah dipakai atau kedaluwarsa."}><Link className="block min-h-12 rounded-xl bg-coral-600 px-5 py-3 text-center font-bold text-white" href="/login">Kembali ke login</Link></AuthCard>;
}
