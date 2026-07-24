import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  IndustryGrid,
  FinalCTA,
  SectionHeading,
} from "@/components/marketing/marketing-sections";
import { PageHero } from "@/components/marketing/site-shell";
import { marketingMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = marketingMetadata({
  title: "Solusi untuk Tim Operasional Lapangan",
  description:
    "FieldProof untuk cleaning service, property management, contractor, maintenance, field sales, dan inspection service.",
  path: "/industries",
});

export default function IndustriesPage() {
  return (
    <main>
      <PageHero
        eyebrow="Solutions by industry"
        title="Setiap industri punya checklist sendiri. Semua membutuhkan bukti yang jelas."
        description="FieldProof menyesuaikan struktur pekerjaan Anda tanpa mengorbankan konsistensi, visibilitas, dan akuntabilitas."
      >
        <Link href="/request-demo" className="marketing-button-primary">
          Jadwalkan Demo <ArrowRight className="size-4" />
        </Link>
      </PageHero>
      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <IndustryGrid />
        </div>
      </section>
      <section className="marketing-section bg-cream-100">
        <div className="marketing-container grid gap-10 lg:grid-cols-[.75fr_1.25fr]">
          <SectionHeading
            align="left"
            eyebrow="Common foundation"
            title="Bangun proses sesuai lapangan, tetap ukur dengan cara yang sama."
            description="Tim dapat memiliki template berbeda untuk setiap pekerjaan, site, atau layanan. Data inti tetap terstruktur untuk pelaporan dan audit."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Template per jenis layanan",
              "Assignment per team dan site",
              "Evidence dengan kategori",
              "Supervisor review",
              "Laporan per client",
              "Jejak perubahan terpusat",
            ].map((item) => (
              <p
                key={item}
                className="flex items-center gap-3 rounded-2xl border bg-white p-5 font-extrabold"
              >
                <CheckCircle2 className="size-5 text-success" />
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>
      <FinalCTA title="Ceritakan alur lapangan Anda. Kami bantu memetakannya di FieldProof." />
    </main>
  );
}
