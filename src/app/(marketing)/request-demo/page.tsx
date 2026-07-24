import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { requestDemoAction } from "./actions";
import { marketingMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = marketingMetadata({
  title: "Jadwalkan Demo FieldProof",
  description:
    "Diskusikan alur operasional lapangan Anda dan lihat bagaimana FieldProof menertibkan checklist, evidence, approval, serta laporan.",
  path: "/request-demo",
});

const inputClass =
  "mt-2 min-h-12 w-full rounded-xl border bg-white px-4 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-coral-600 focus:ring-4 focus:ring-coral-100";

export default async function RequestDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  if (query.sent) {
    return (
      <main className="marketing-grid-bg">
        <div className="marketing-container grid min-h-[42rem] place-items-center py-20">
          <section className="w-full max-w-xl rounded-[2rem] border bg-white p-8 text-center shadow-xl sm:p-12">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-50 text-success">
              <CheckCircle2 className="size-8" />
            </span>
            <h1 className="mt-7 text-3xl font-black tracking-tight">
              Permintaan demo sudah diterima.
            </h1>
            <p className="mt-4 leading-7 text-ink-soft">
              Tim kami akan meninjau kebutuhan Anda dan menghubungi melalui
              email yang diberikan.
            </p>
            <Link href="/" className="marketing-button-primary mt-8">
              <ArrowLeft className="size-4" /> Kembali ke Beranda
            </Link>
          </section>
        </div>
      </main>
    );
  }
  const errorMessage =
    query.error === "rate-limit"
      ? "Terlalu banyak permintaan. Silakan coba kembali dalam satu jam."
      : query.error === "delivery"
        ? "Permintaan belum dapat dikirim. Silakan coba beberapa saat lagi."
        : query.error
          ? "Periksa kembali field wajib dan format email Anda."
          : null;
  return (
    <main className="marketing-grid-bg">
      <div className="marketing-container grid gap-12 py-16 lg:grid-cols-[.8fr_1.2fr] lg:py-24">
        <section className="lg:sticky lg:top-28 lg:self-start">
          <p className="marketing-eyebrow">Request a demo</p>
          <h1 className="mt-5 text-balance text-4xl font-black leading-tight tracking-[-0.045em] sm:text-5xl">
            Lihat FieldProof dengan konteks operasional Anda.
          </h1>
          <p className="mt-5 text-lg leading-8 text-ink-soft">
            Bawa contoh alur, checklist, atau laporan yang masih manual. Kami
            akan menunjukkan cara memetakannya menjadi workflow FieldProof.
          </p>
          <div className="mt-8 space-y-4">
            {[
              [
                CalendarCheck2,
                "Demo sesuai use case",
                "Fokus pada industri, role, dan jenis pekerjaan tim Anda.",
              ],
              [
                Clock3,
                "Sesi ringkas dan konkret",
                "Lihat alur dari assignment hingga laporan tanpa presentasi berputar-putar.",
              ],
              [
                ShieldCheck,
                "Tanpa klaim palsu",
                "Kami jelaskan fitur aktif, batasan, dan kebutuhan implementasi dengan transparan.",
              ],
            ].map(([Icon, title, text]) => (
              <article
                key={String(title)}
                className="flex gap-4 rounded-2xl border bg-white/80 p-4"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-coral-100 text-coral-800">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h2 className="font-black">{String(title)}</h2>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">
                    {String(text)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section
          className="rounded-[2rem] border bg-white p-6 shadow-[0_24px_80px_rgba(112,47,40,.10)] sm:p-9"
          aria-labelledby="demo-form-title"
        >
          <h2 id="demo-form-title" className="text-2xl font-black">
            Ceritakan kebutuhan tim Anda
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Field bertanda * wajib diisi. Data hanya digunakan untuk
            menindaklanjuti permintaan demo.
          </p>
          {errorMessage ? (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800"
            >
              {errorMessage}
            </p>
          ) : null}
          <form
            action={requestDemoAction}
            className="mt-7 grid gap-5 sm:grid-cols-2"
          >
            <Field
              label="Nama lengkap *"
              name="name"
              autoComplete="name"
              required
            />
            <Field
              label="Email kerja *"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
            <Field
              label="Perusahaan *"
              name="company"
              autoComplete="organization"
              required
            />
            <Field
              label="Nomor telepon"
              name="phone"
              type="tel"
              autoComplete="tel"
            />
            <Field
              label="Jabatan / role *"
              name="role"
              autoComplete="organization-title"
              required
            />
            <label className="text-sm font-extrabold">
              Ukuran tim *
              <select
                name="teamSize"
                className={inputClass}
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Pilih ukuran tim
                </option>
                <option value="1-5">1–5 anggota</option>
                <option value="6-25">6–25 anggota</option>
                <option value="26-100">26–100 anggota</option>
                <option value="100+">Lebih dari 100</option>
              </select>
            </label>
            <label className="text-sm font-extrabold">
              Industri *
              <select
                name="industry"
                className={inputClass}
                required
                defaultValue={query.industry ?? ""}
              >
                <option value="" disabled>
                  Pilih industri
                </option>
                <option value="Cleaning Service">Cleaning Service</option>
                <option value="Property Management">Property Management</option>
                <option value="Contractor">Contractor</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Field Sales">Field Sales</option>
                <option value="Inspection Service">Inspection Service</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </label>
            <label className="text-sm font-extrabold">
              Paket yang diminati
              <select
                name="plan"
                className={inputClass}
                defaultValue={query.plan ?? ""}
              >
                <option value="">Belum ditentukan</option>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="business">Business</option>
              </select>
            </label>
            <label className="text-sm font-extrabold sm:col-span-2">
              Apa yang ingin Anda rapikan?
              <textarea
                name="message"
                rows={5}
                maxLength={2000}
                className={inputClass + " py-3"}
                placeholder="Contoh: tim cleaning 20 orang, 8 lokasi, laporan mingguan masih dibuat manual."
              />
            </label>
            <label className="sr-only" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <label className="flex items-start gap-3 text-sm leading-6 text-ink-soft sm:col-span-2">
              <input
                type="checkbox"
                name="consent"
                required
                className="mt-1 size-5 shrink-0 accent-coral-600"
              />
              <span>
                Saya setuju FieldProof menghubungi saya mengenai permintaan demo
                ini.
              </span>
            </label>
            <button
              className="marketing-button-primary sm:col-span-2"
              type="submit"
            >
              Kirim Permintaan Demo
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-extrabold">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className={inputClass}
      />
    </label>
  );
}
