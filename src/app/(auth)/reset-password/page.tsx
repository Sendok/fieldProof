import { AuthCard, Field, SubmitButton } from "@/components/forms/auth-card";
import { resetPasswordAction } from "../actions";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  return <AuthCard title="Password baru" description="Gunakan password unik minimal 10 karakter.">{query.error ? <p className="mb-5 rounded-xl bg-coral-50 p-3 text-sm font-semibold text-coral-800">Tautan reset tidak valid atau kedaluwarsa.</p> : null}<form action={resetPasswordAction} className="space-y-5"><input type="hidden" name="token" value={query.token ?? ""} /><Field label="Password baru" name="password" type="password" autoComplete="new-password" /><SubmitButton>Simpan password</SubmitButton></form></AuthCard>;
}
