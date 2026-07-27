import Link from "next/link";
import { AuthCard, Field, SubmitButton } from "@/components/forms/auth-card";
import { loginAction } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  return <AuthCard title="Masuk ke FieldProof" description="Lanjutkan pekerjaan lapangan dan review tim Anda." footer={<>Belum punya akun? <Link className="font-bold text-coral-700" href="/register">Daftar</Link></>}>
    {query.registered ? <p className="mb-5 rounded-xl bg-success/10 p-3 text-sm font-semibold text-success">Cek email Anda untuk verifikasi sebelum masuk.</p> : null}
    {query.error ? <p className="mb-5 rounded-xl bg-coral-50 p-3 text-sm font-semibold text-coral-800">{query.error === "unavailable" ? "Layanan login sedang tidak tersedia. Data Anda aman; coba lagi setelah layanan database aktif." : "Email atau password tidak valid."}</p> : null}
    {process.env.NODE_ENV === "development" ? (
      <div className="mb-5 rounded-xl border border-coral-200 bg-cream-100 p-3 text-sm text-ink-700">
        <p className="font-bold text-ink-900">Akun demo</p>
        <p className="mt-1 break-all">Owner: owner@fieldproof.local</p>
        <p className="break-all">Worker PWA: worker@fieldproof.local</p>
        <p className="mt-1 break-all font-semibold">Password: FieldProofDev123!</p>
      </div>
    ) : null}
    <form action={loginAction} className="space-y-5"><Field label="Email" name="email" type="email" autoComplete="email" /><Field label="Password" name="password" type="password" autoComplete="current-password" /><SubmitButton>Masuk</SubmitButton></form>
    <Link href="/forgot-password" className="mt-5 block text-center text-sm font-bold text-coral-700">Lupa password?</Link>
  </AuthCard>;
}
