import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Images,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  UserCheck,
} from "lucide-react";
import { ProductTour } from "@/components/marketing/product-tour";
import {
  FAQ,
  FeatureGrid,
  FinalCTA,
  IndustryGrid,
  InlineLink,
  PricingCards,
  SectionHeading,
} from "@/components/marketing/marketing-sections";
import { securityPoints } from "@/components/marketing/marketing-data";
import { marketingMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = marketingMetadata({
  title: "Bukti Kerja Lapangan yang Tidak Lagi Berantakan",
  description:
    "Kelola tugas, checklist, foto sebelum-sesudah, approval supervisor, dan laporan klien dalam satu platform FieldProof.",
  path: "/",
});

const problems = [
  {
    icon: MessageCircle,
    title: "Foto tercecer di WhatsApp",
    text: "Bukti kehilangan konteks pekerjaan, lokasi, waktu, dan petugas.",
  },
  {
    icon: ClipboardCheck,
    title: "Checklist tidak lengkap",
    text: "Langkah wajib terlewat dan baru diketahui setelah tim meninggalkan lokasi.",
  },
  {
    icon: UserCheck,
    title: "Supervisor sulit memantau",
    text: "Status lapangan harus ditanyakan satu per satu melalui chat atau telepon.",
  },
  {
    icon: FileSpreadsheet,
    title: "Laporan dibuat manual",
    text: "Admin menyalin foto dan jawaban ke dokumen setiap akhir periode.",
  },
  {
    icon: ShieldCheck,
    title: "Klien sulit memverifikasi",
    text: "Bukti yang dikirim tidak menunjukkan hubungan jelas dengan pekerjaan.",
  },
] as const;

const steps = [
  [
    "01",
    "Buat dan tugaskan pekerjaan",
    "Pilih lokasi, jadwal, template, petugas, serta supervisor yang bertanggung jawab.",
  ],
  [
    "02",
    "Petugas mengisi checklist dan bukti foto",
    "Field wajib dan kategori evidence menjaga dokumentasi tetap konsisten.",
  ],
  [
    "03",
    "Supervisor melakukan review",
    "Periksa kelengkapan, minta revisi bila perlu, lalu berikan approval.",
  ],
  [
    "04",
    "Sistem menghasilkan laporan klien",
    "Gabungkan detail, checklist, evidence, approval, dan audit menjadi satu laporan.",
  ],
] as const;

export default function MarketingHomePage() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FieldProof",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: metadata.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "IDR",
      category: "Starter",
    },
    featureList: [
      "Work order management",
      "Digital checklist",
      "Before and after evidence",
      "Offline draft",
      "Supervisor approval",
      "Client report",
      "Audit trail",
      "Analytics",
    ],
  };
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      <section className="marketing-grid-bg relative overflow-hidden">
        <div className="marketing-container grid min-h-[43rem] items-center gap-12 py-16 lg:grid-cols-[1.02fr_.98fr] lg:py-24">
          <div className="marketing-reveal">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-extrabold text-ink-soft shadow-sm">
              <span className="grid size-6 place-items-center rounded-full bg-coral-100 text-coral-800">
                <Check className="size-3.5" />
              </span>
              Bukti kerja yang punya konteks
            </div>
            <h1 className="marketing-hero-title mt-7 max-w-3xl text-balance text-ink">
              Bukti Kerja Lapangan yang{" "}
              <span className="relative whitespace-nowrap text-coral-600">
                Tidak Lagi
                <span
                  className="absolute inset-x-0 -bottom-1 h-2 -rotate-1 rounded-full bg-coral-200/80"
                  aria-hidden="true"
                />
              </span>{" "}
              Berantakan.
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-ink-soft sm:text-xl">
              Kelola tugas, checklist, foto sebelum-sesudah, approval
              supervisor, dan laporan klien dalam satu platform.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="marketing-button-primary text-base"
              >
                Mulai Gratis <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/demo"
                className="marketing-button-secondary text-base"
              >
                Lihat Demo
              </Link>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-muted">
              <Smartphone className="size-4 text-coral-700" />
              Tanpa instalasi. Dapat digunakan langsung melalui browser HP.
            </p>
          </div>
          <HeroVisual />
        </div>
        <div className="border-y bg-white/70 py-4 backdrop-blur">
          <p className="marketing-container text-center text-sm font-extrabold text-ink-soft">
            Dipercaya oleh tim operasional yang membutuhkan bukti pekerjaan
            lebih rapi.
          </p>
        </div>
      </section>

      <section className="marketing-section overflow-hidden bg-white">
        <div className="marketing-container">
          <SectionHeading
            eyebrow="Satu alur, satu sumber bukti"
            title="Lihat pekerjaan bergerak dari penugasan sampai laporan."
            description="Berpindah antara work order, checklist mobile, evidence, approval, dan report tanpa memindahkan data secara manual."
          />
          <div className="mt-12">
            <ProductTour />
          </div>
        </div>
      </section>

      <section className="marketing-section bg-cream-100">
        <div className="marketing-container">
          <SectionHeading
            eyebrow="Masalah yang terlalu familiar"
            title="Operasional terlihat selesai. Buktinya belum tentu siap."
            description="Tanpa struktur, dokumentasi lapangan berubah menjadi pekerjaan admin yang panjang dan sulit diverifikasi."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {problems.map(({ icon: Icon, title, text }, index) => (
              <article
                key={title}
                className="relative rounded-2xl border bg-white p-5 shadow-sm"
              >
                <span className="absolute right-4 top-4 font-mono text-xs font-bold text-muted">
                  0{index + 1}
                </span>
                <span className="grid size-11 place-items-center rounded-xl bg-coral-50 text-coral-700">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-6 font-black">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-section bg-ink text-white">
        <div className="marketing-container">
          <SectionHeading
            inverse
            eyebrow="Cara kerja"
            title="Empat langkah dari tugas ke bukti yang disetujui."
            description="Alur sederhana untuk petugas, tetap lengkap untuk supervisor dan klien."
          />
          <div className="mt-14 grid gap-4 lg:grid-cols-4">
            {steps.map(([number, title, text], index) => (
              <article
                key={number}
                className="relative rounded-2xl border border-white/12 bg-white/[.06] p-6"
              >
                <p className="font-mono text-sm font-black text-coral-300">
                  {number}
                </p>
                <h3 className="mt-8 text-xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">{text}</p>
                {index < steps.length - 1 ? (
                  <ArrowRight className="absolute -right-3 top-9 z-10 hidden size-6 rounded-full bg-coral-500 p-1 lg:block" />
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <SectionHeading
            eyebrow="Main features"
            title="Semua yang dibutuhkan untuk menertibkan pekerjaan lapangan."
            description="Setiap fitur dirancang untuk mengurangi rekap manual sekaligus memperkuat akuntabilitas."
          />
          <div>
            <FeatureGrid />
          </div>
          <div className="mt-8 text-center">
            <InlineLink href="/features">Pelajari seluruh fitur</InlineLink>
          </div>
        </div>
      </section>

      <section className="marketing-section overflow-hidden bg-cream-100">
        <div className="marketing-container grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Before & after evidence"
              title="Dua foto. Satu cerita pekerjaan yang utuh."
              description="Foto sebelum dan sesudah terhubung ke work order, field checklist, petugas, waktu, serta lokasi—bukan sekadar file di galeri."
            />
            <ul className="mt-7 space-y-3">
              {[
                "Kategori evidence yang konsisten",
                "Caption dan metadata lapangan",
                "Upload private dan akses terkontrol",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 font-bold">
                  <CheckCircle2 className="size-5 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <BeforeAfterShowcase />
        </div>
      </section>

      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <SectionHeading
            eyebrow="Industry use cases"
            title="Berbeda pekerjaan, prinsip buktinya sama."
            description="Sesuaikan template dan alur tanpa kehilangan struktur dasar yang dibutuhkan setiap tim operasional."
          />
          <div>
            <IndustryGrid />
          </div>
          <div className="mt-8 text-center">
            <InlineLink href="/industries">
              Lihat solusi per industri
            </InlineLink>
          </div>
        </div>
      </section>

      <section className="marketing-section bg-cream-100">
        <div className="marketing-container grid items-center gap-14 lg:grid-cols-2">
          <MobileDevice />
          <div>
            <SectionHeading
              align="left"
              eyebrow="Mobile field worker"
              title="Cukup buka browser HP, lalu mulai bekerja."
              description="Pengalaman mobile memprioritaskan tap target besar, progress yang jelas, kamera, GPS, signature, dan draft yang dapat dipulihkan."
            />
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                "Tanpa instalasi app store",
                "Draft offline-lite",
                "Kamera dan galeri",
                "Status sinkronisasi",
              ].map((item) => (
                <p
                  key={item}
                  className="flex items-center gap-2 rounded-xl border bg-white p-3 text-sm font-extrabold"
                >
                  <Check className="size-4 text-coral-700" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section bg-white">
        <div className="marketing-container grid items-center gap-14 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Supervisor approval"
              title="Review exception, bukan mengejar update."
              description="Supervisor menerima submission yang sudah tersusun, melihat kelengkapan bukti, lalu menyetujui atau mengembalikan pekerjaan untuk revisi."
            />
            <div className="mt-8 flex gap-3">
              <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-extrabold text-green-800">
                Approve
              </span>
              <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-extrabold text-red-700">
                Revision required
              </span>
            </div>
          </div>
          <ApprovalFlow />
        </div>
      </section>

      <section className="marketing-section bg-ink text-white">
        <div className="marketing-container grid items-center gap-14 lg:grid-cols-[1.1fr_.9fr]">
          <ReportPaper />
          <div>
            <SectionHeading
              inverse
              align="left"
              eyebrow="Client-ready PDF report"
              title="Dari data lapangan menjadi laporan yang siap dikirim."
              description="Susun identitas pekerjaan, jawaban checklist, before-after evidence, approval, serta revision ke dalam report yang mudah dibaca klien."
            />
            <Link href="/demo" className="marketing-button-light mt-8">
              Lihat contoh report <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="marketing-section bg-cream-100">
        <div className="marketing-container">
          <SectionHeading
            eyebrow="Security & accountability"
            title="Bukti operasional harus aman sekaligus dapat ditelusuri."
            description="FieldProof membangun kontrol akses dan jejak perubahan ke dalam alur, bukan menambahkannya setelah masalah terjadi."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {securityPoints.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border bg-white p-6">
                <Icon className="size-6 text-coral-700" />
                <h3 className="mt-5 text-lg font-black">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{text}</p>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-muted">
            FieldProof menjaga konteks dan histori bukti. Kami tidak mengklaim
            foto digital mustahil dimanipulasi.
          </p>
        </div>
      </section>

      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <PricingCards />
        </div>
      </section>

      <section className="marketing-section bg-cream-100">
        <div className="marketing-container">
          <SectionHeading eyebrow="FAQ" title="Pertanyaan sebelum memulai." />
          <div>
            <FAQ />
          </div>
        </div>
      </section>

      <FinalCTA />
    </main>
  );
}

function HeroVisual() {
  return (
    <div className="marketing-float relative mx-auto w-full max-w-xl lg:mr-0">
      <div className="absolute -left-5 top-14 z-20 hidden rounded-2xl border bg-white p-3 shadow-xl sm:-left-12 sm:block">
        <p className="text-[10px] font-black text-muted">COMPLETION RATE</p>
        <p className="mt-1 text-2xl font-black">96.4%</p>
        <span className="text-[10px] font-bold text-success">
          ↑ 8.2% bulan ini
        </span>
      </div>
      <div className="rotate-[1.2deg] rounded-[1.75rem] border bg-white p-3 shadow-[0_30px_100px_rgba(112,47,40,.18)]">
        <div className="rounded-2xl bg-ink p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-coral-200">
                FIELD OPERATIONS
              </p>
              <h2 className="mt-1 text-xl font-black">Work order dashboard</h2>
            </div>
            <span className="rounded-lg bg-coral-500 px-3 py-2 text-xs font-black">
              + New
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              ["18", "Hari ini"],
              ["5", "Review"],
              ["2", "Terlambat"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl bg-white/10 p-3">
                <p className="text-xl font-black">{value}</p>
                <p className="text-[10px] text-white/55">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2 p-3">
          {[
            ["Lobby deep cleaning", "IN PROGRESS"],
            ["Fire extinguisher check", "ASSIGNED"],
            ["AC maintenance", "SUBMITTED"],
          ].map(([title, status], index) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-xl border bg-cream-50 p-3"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-coral-100 text-xs font-black text-coral-800">
                0{index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black">{title}</p>
                <p className="mt-1 text-[9px] font-bold text-muted">
                  Hotel Coral Bay
                </p>
              </div>
              <span className="text-[8px] font-black text-coral-700">
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-5 right-0 z-20 w-36 -rotate-3 rounded-[1.5rem] border-[4px] border-ink bg-white p-2.5 shadow-xl sm:-bottom-8 sm:-right-8 sm:w-48 sm:rounded-[1.75rem] sm:border-[5px] sm:p-3">
        <div className="rounded-xl bg-coral-600 p-3 text-white">
          <p className="text-[8px] font-black">WO-1842</p>
          <p className="mt-1 text-xs font-black">Lobby cleaning</p>
        </div>
        <p className="mt-3 text-[10px] font-black">Checklist · 4/5</p>
        <div className="mt-2 h-1.5 rounded-full bg-cream-100">
          <div className="h-full w-4/5 rounded-full bg-coral-500" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1">
          <span className="aspect-square rounded-lg bg-[#a69587]" />
          <span className="aspect-square rounded-lg bg-[#eadbc9]" />
        </div>
      </div>
    </div>
  );
}

function BeforeAfterShowcase() {
  return (
    <div className="relative grid grid-cols-2 gap-3 rounded-[2rem] border bg-white p-4 shadow-xl sm:p-6">
      {[
        ["SEBELUM", "bg-[#a99a8d]", "08:12"],
        ["SESUDAH", "bg-[#eadbc8]", "09:04"],
      ].map(([label, color, time], index) => (
        <div
          key={label}
          className={
            "relative aspect-[4/5] overflow-hidden rounded-2xl " + color
          }
        >
          <div className="absolute inset-x-[12%] top-[18%] h-[40%] rounded-t-xl border-[8px] border-white/40 bg-ink/10" />
          <div
            className={
              "absolute inset-x-[14%] bottom-[20%] h-[16%] rounded-full blur-md " +
              (index === 0 ? "bg-ink/40" : "bg-white/80")
            }
          />
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2 py-1 text-[10px] font-black text-white">
            {label}
          </span>
          <span className="absolute bottom-3 right-3 text-xs font-black text-white">
            {time}
          </span>
        </div>
      ))}
      <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cream-50 p-3 text-xs">
        <span className="flex items-center gap-1 font-bold">
          <MapPin className="size-3.5 text-coral-700" /> Hotel Coral Bay
        </span>
        <span className="font-bold text-muted">Dewi Lestari · 21 Jul 2026</span>
      </div>
    </div>
  );
}

function MobileDevice() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 rounded-full bg-coral-200/35 blur-3xl" />
      <div className="relative mx-auto max-w-[21rem] rounded-[2.5rem] border-[8px] border-ink bg-white p-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-ink/20" />
        <div className="rounded-2xl bg-coral-600 p-4 text-white">
          <p className="text-[10px] font-black text-coral-100">IN PROGRESS</p>
          <h3 className="mt-1 font-black">Room inspection · 307</h3>
          <p className="mt-2 text-xs text-white/70">Hotel Coral Bay</p>
        </div>
        <div className="mt-3 space-y-2">
          {["Bed & linen", "Bathroom", "Amenities", "Final photo"].map(
            (item, index) => (
              <div
                key={item}
                className="flex min-h-12 items-center gap-3 rounded-xl border px-3 text-xs font-bold"
              >
                {index < 3 ? (
                  <CheckCircle2 className="size-5 text-success" />
                ) : (
                  <Images className="size-5 text-coral-700" />
                )}
                {item}
              </div>
            ),
          )}
        </div>
        <div className="mt-3 flex justify-between rounded-xl bg-green-50 p-3 text-xs font-black text-green-800">
          <span>● Online</span>
          <span>3/4 lengkap</span>
        </div>
      </div>
    </div>
  );
}

function ApprovalFlow() {
  return (
    <div className="rounded-[2rem] border bg-cream-50 p-5 shadow-lg sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-coral-700">SUBMISSION #1</p>
          <h3 className="mt-1 text-xl font-black">Lobby deep cleaning</h3>
        </div>
        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
          REVIEW
        </span>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {[
          "Checklist lengkap",
          "Evidence 4 file",
          "GPS tercatat",
          "Signature tersedia",
        ].map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-xl border bg-white p-3 text-sm font-bold"
          >
            <Check className="size-4 text-success" />
            {item}
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl border-l-4 border-coral-500 bg-white p-4">
        <p className="text-xs font-black text-muted">CATATAN SUPERVISOR</p>
        <p className="mt-2 text-sm leading-6">
          Evidence lengkap dan kondisi akhir sesuai standar area lobby.
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <span className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-success px-4 text-sm font-black text-white">
          <FileCheck2 className="mr-2 size-4" /> Setujui
        </span>
        <span className="flex min-h-12 flex-1 items-center justify-center rounded-xl border bg-white px-4 text-sm font-black">
          Minta revisi
        </span>
      </div>
    </div>
  );
}

function ReportPaper() {
  return (
    <div className="mx-auto w-full max-w-xl rotate-[-1deg] bg-white p-6 text-ink shadow-[0_24px_80px_rgba(0,0,0,.3)] sm:p-8">
      <div className="flex items-start justify-between border-b-2 border-ink pb-5">
        <div>
          <p className="text-xs font-black tracking-widest text-coral-700">
            FIELDPROOF
          </p>
          <h3 className="mt-2 text-2xl font-black">Laporan Pekerjaan</h3>
        </div>
        <FileText className="size-8 text-coral-600" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
        {[
          ["Work order", "WO-1842"],
          ["Klien", "Coral Bay"],
          ["Status", "Approved"],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="font-bold text-muted">{label}</p>
            <p className="mt-1 font-black">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl bg-cream-100 p-4">
        <div className="flex items-center justify-between text-xs font-black">
          <span>Checklist</span>
          <span className="text-success">5 / 5 selesai</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <span className="aspect-[4/3] rounded-lg bg-[#a99a8d]" />
          <span className="aspect-[4/3] rounded-lg bg-[#eadbc8]" />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3 border-t pt-4">
        <span className="grid size-9 place-items-center rounded-full bg-green-50 text-success">
          <Check className="size-4" />
        </span>
        <div>
          <p className="text-xs font-black">Disetujui Raka Pratama</p>
          <p className="text-[10px] text-muted">21 Juli 2026 · 09:24 WIB</p>
        </div>
      </div>
    </div>
  );
}
