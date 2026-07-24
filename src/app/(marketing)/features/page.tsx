import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers3, Workflow } from "lucide-react";
import { ProductTour } from "@/components/marketing/product-tour";
import {
  FeatureGrid,
  FinalCTA,
  SectionHeading,
} from "@/components/marketing/marketing-sections";
import { PageHero } from "@/components/marketing/site-shell";
import { marketingMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = marketingMetadata({
  title: "Fitur FieldProof",
  description:
    "Work order, checklist digital, before-after evidence, offline draft, approval, report, audit trail, dan analytics dalam satu platform.",
  path: "/features",
});

export default function FeaturesPage() {
  return (
    <main>
      <PageHero
        eyebrow="Fitur FieldProof"
        title="Satu sistem untuk mengatur pekerjaan dan membuktikan hasilnya."
        description="FieldProof menyatukan perencanaan, eksekusi mobile, evidence, kontrol supervisor, dan pelaporan tanpa rantai rekap manual."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="marketing-button-primary">
            Mulai Gratis <ArrowRight className="size-4" />
          </Link>
          <Link href="/demo" className="marketing-button-secondary">
            Lihat Demo
          </Link>
        </div>
      </PageHero>
      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <SectionHeading
            eyebrow="Core capabilities"
            title="Dari control room sampai browser HP petugas."
          />
          <FeatureGrid />
        </div>
      </section>
      <section className="marketing-section bg-cream-100">
        <div className="marketing-container grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Connected workflow"
              title="Bukan delapan fitur yang berdiri sendiri."
              description="Setiap informasi mengikuti work order yang sama. Assignment membuka checklist, checklist menghasilkan evidence, submission memicu review, dan revision tetap tercatat."
            />
            <div className="mt-7 space-y-3">
              {[
                "Data tidak perlu diketik ulang",
                "Template version tetap konsisten",
                "Hak akses mengikuti organisasi dan assignment",
              ].map((item) => (
                <p key={item} className="flex items-center gap-3 font-bold">
                  <CheckCircle2 className="size-5 text-success" />
                  {item}
                </p>
              ))}
            </div>
          </div>
          <ProductTour compact />
        </div>
      </section>
      <section className="marketing-section bg-white">
        <div className="marketing-container grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl bg-ink p-8 text-white">
            <Layers3 className="size-8 text-coral-300" />
            <h2 className="mt-7 text-3xl font-black">
              Struktur yang fleksibel.
            </h2>
            <p className="mt-4 max-w-lg leading-7 text-white/65">
              Gunakan client, site, team, template, dan role untuk memodelkan
              operasi tanpa mencampur data antar organisasi.
            </p>
          </article>
          <article className="rounded-3xl border bg-cream-50 p-8">
            <Workflow className="size-8 text-coral-700" />
            <h2 className="mt-7 text-3xl font-black">
              Workflow yang terkendali.
            </h2>
            <p className="mt-4 max-w-lg leading-7 text-ink-soft">
              Status pekerjaan bergerak melalui transisi domain yang valid dan
              selalu meninggalkan histori.
            </p>
          </article>
        </div>
      </section>
      <FinalCTA title="Lihat bagaimana seluruh alur bekerja pada pekerjaan nyata." />
    </main>
  );
}
