import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";
import {
  FAQ,
  FinalCTA,
  PricingCards,
  SectionHeading,
} from "@/components/marketing/marketing-sections";
import { PageHero } from "@/components/marketing/site-shell";
import { marketingMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = marketingMetadata({
  title: "Harga FieldProof",
  description:
    "Paket Starter, Growth, dan Business untuk tim operasional lapangan dari skala kecil sampai enterprise.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <main>
      <PageHero
        eyebrow="Pricing"
        title="Paket yang mengikuti skala operasional Anda."
        description="Mulai dengan kebutuhan inti, kemudian tambahkan kapasitas, branding, portal klien, analytics, dan kontrol enterprise."
      >
        <Link href="/request-demo" className="marketing-button-primary">
          Diskusikan Kebutuhan <ArrowRight className="size-4" />
        </Link>
      </PageHero>
      <section className="marketing-section bg-white">
        <div className="marketing-container">
          <PricingCards showHeading={false} />
        </div>
      </section>
      <section className="marketing-section bg-cream-100">
        <div className="marketing-container">
          <SectionHeading
            eyebrow="Pricing FAQ"
            title="Hal yang perlu diketahui sebelum memilih paket."
          />
          <FAQ />
          <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border bg-white p-5 text-sm leading-6 text-ink-soft">
            <HelpCircle className="mt-0.5 size-5 shrink-0 text-coral-700" />
            Harga nominal Growth dan Business ditentukan berdasarkan kebutuhan
            implementasi. Jadwalkan demo untuk mendapatkan proposal yang sesuai,
            tanpa angka palsu atau biaya yang disembunyikan.
          </div>
        </div>
      </section>
      <FinalCTA title="Mulai gratis, lalu naikkan kapasitas ketika tim Anda siap." />
    </main>
  );
}
