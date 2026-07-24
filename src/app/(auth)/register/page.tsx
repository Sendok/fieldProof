import Link from "next/link";
import { AuthCard, Field, SubmitButton } from "@/components/forms/auth-card";
import { registerAction } from "../actions";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  return <AuthCard title="Mulai dengan FieldProof" description="Buat akun aman Anda. Organisasi dibuat setelah email terverifikasi." footer={<>Sudah punya akun? <Link className="font-bold text-coral-700" href="/login">Masuk</Link></>}>
    <form action={registerAction} className="space-y-5"><input type="hidden" name="invitationToken" value={query.invitation ?? ""} /><Field label="Nama lengkap" name="name" autoComplete="name" /><Field label="Email kerja" name="email" type="email" autoComplete="email" /><Field label="Password (minimum 10 karakter)" name="password" type="password" autoComplete="new-password" /><SubmitButton>Daftar</SubmitButton></form>
  </AuthCard>;
}
