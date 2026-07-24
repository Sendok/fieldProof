import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function AuthCard({ title, description, children, footer }: { title: string; description: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-cream-50 px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-border bg-white p-7 shadow-[0_24px_70px_rgba(112,47,40,.08)] sm:p-9">
        <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-extrabold text-ink"><span className="grid size-9 place-items-center rounded-xl bg-coral-600 text-white"><CheckCircle2 className="size-5" /></span>FieldProof</Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 leading-7 text-ink-soft">{description}</p>
        <div className="mt-7">{children}</div>
        {footer ? <div className="mt-6 border-t border-border pt-5 text-sm text-ink-soft">{footer}</div> : null}
      </section>
    </main>
  );
}

export function Field({ label, name, type = "text", autoComplete, required = true, defaultValue }: { label: string; name: string; type?: string; autoComplete?: string; required?: boolean; defaultValue?: string }) {
  return <label className="block text-sm font-bold text-ink">{label}<input className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-base font-medium text-ink outline-none transition focus:border-coral-600 focus:ring-3 focus:ring-coral-100" name={name} type={type} autoComplete={autoComplete} required={required} defaultValue={defaultValue} /></label>;
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  return <button className="min-h-12 w-full rounded-xl bg-coral-600 px-5 font-bold text-white transition hover:bg-coral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-700" type="submit">{children}</button>;
}
