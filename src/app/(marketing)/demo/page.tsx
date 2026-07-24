import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { MiniWorkflow, ProductTour } from "@/components/marketing/product-tour";
import {
  FinalCTA,
  SectionHeading,
} from "@/components/marketing/marketing-sections";
import { PageHero } from "@/components/marketing/site-shell";
import { marketingMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = marketingMetadata({
  title: "Demo Produk FieldProof",
  description:
    "Jelajahi alur FieldProof dari work order, checklist mobile, before-after evidence, supervisor approval, sampai PDF report.",
  path: "/demo",
});

export default function DemoPage() {
  return (
    <main>
      <PageHero
        eyebrow="Interactive product tour"
        title="Ikuti perjalanan satu pekerjaan dari assignment sampai report."
        description="Gunakan tab di bawah untuk melihat bagaimana informasi yang sama bergerak melalui setiap peran tanpa kehilangan konteks."
      >
        <Link href="/request-demo" className="marketing-button-primary">
          Jadwalkan Demo Langsung <ArrowRight className="size-4" />
        </Link>
      </PageHero>
      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <MiniWorkflow />
          <div className="mt-8">
            <ProductTour />
          </div>
        </div>
      </section>
      <section className="marketing-section bg-cream-100">
        <div className="marketing-container grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <SectionHeading
            align="left"
            eyebrow="What this demo shows"
            title="Satu record, banyak tampilan sesuai kebutuhan peran."
            description="Admin melihat kapasitas dan jadwal, petugas melihat langkah kerja, supervisor melihat kelengkapan, sedangkan klien menerima laporan yang ringkas."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Dashboard work order",
              "Mobile checklist",
              "Before-after evidence",
              "Supervisor approval",
              "PDF client report",
              "Audit-ready metadata",
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
      <FinalCTA title="Butuh demo dengan alur dan template milik tim Anda?" />
    </main>
  );
}
