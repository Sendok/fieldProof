import Link from "next/link";
import { AuthCard, SubmitButton } from "@/components/forms/auth-card";
import { auth } from "@/server/auth";
import { acceptInvitationAction } from "./actions";

export default async function InvitationPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ token }, query, session] = await Promise.all([params, searchParams, auth()]);
  return <AuthCard title="Undangan organisasi" description="Terima undangan untuk bergabung ke workspace FieldProof.">{query.error ? <p className="mb-5 rounded-xl bg-coral-50 p-3 text-sm font-semibold text-coral-800">Undangan tidak valid, kedaluwarsa, atau digunakan oleh email lain.</p> : null}{session?.user ? <form action={acceptInvitationAction}><input type="hidden" name="token" value={token} /><SubmitButton>Terima undangan</SubmitButton></form> : <div className="space-y-3"><Link href="/login" className="block rounded-xl bg-coral-600 px-5 py-3 text-center font-bold text-white">Masuk untuk melanjutkan</Link><Link href={`/register?invitation=${encodeURIComponent(token)}`} className="block rounded-xl border border-border px-5 py-3 text-center font-bold text-ink">Buat akun dari undangan</Link></div>}</AuthCard>;
}
