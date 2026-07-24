import { AuthCard, Field, SubmitButton } from "@/components/forms/auth-card";
import { forgotPasswordAction } from "../actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  return <AuthCard title="Reset password" description="Kami akan mengirim tautan reset jika email terdaftar.">{query.sent ? <p className="mb-5 rounded-xl bg-success/10 p-3 text-sm font-semibold text-success">Periksa inbox Anda. Pesan ini tetap sama untuk semua alamat demi keamanan.</p> : null}<form action={forgotPasswordAction} className="space-y-5"><Field label="Email" name="email" type="email" autoComplete="email" /><SubmitButton>Kirim tautan reset</SubmitButton></form></AuthCard>;
}
