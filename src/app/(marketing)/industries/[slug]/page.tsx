import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, X } from "lucide-react";
import { industries } from "@/components/marketing/marketing-data";
import {
  FinalCTA,
  SectionHeading,
} from "@/components/marketing/marketing-sections";
import { PageHero } from "@/components/marketing/site-shell";
import { marketingMetadata } from "@/lib/marketing-metadata";

export function generateStaticParams() {
  return industries.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = industries.find((item) => item.slug === slug);
  if (!industry) return {};
  return marketingMetadata({
    title: "FieldProof untuk " + industry.name,
    description: industry.description,
    path: "/industries/" + industry.slug,
  });
}

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = industries.find((item) => item.slug === slug);
  if (!industry) notFound();
  const Icon = industry.icon;
  return (
    <main>
      <PageHero
        eyebrow={"FieldProof for " + industry.name}
        title={industry.headline}
        description={industry.description}
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={"/request-demo?industry=" + encodeURIComponent(industry.name)}
            className="marketing-button-primary"
          >
            Jadwalkan Demo <ArrowRight className="size-4" />
          </Link>
          <Link href="/register" className="marketing-button-secondary">
            Mulai Gratis
          </Link>
        </div>
      </PageHero>
      <section className="marketing-section bg-white">
        <div className="marketing-container grid items-start gap-12 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-[2rem] bg-coral-600 p-8 text-white">
            <span className="grid size-14 place-items-center rounded-2xl bg-white/15">
              <Icon className="size-7" />
            </span>
            <p className="mt-8 text-sm font-black uppercase tracking-widest text-coral-100">
              Tanpa FieldProof
            </p>
            <div className="mt-5 space-y-3">
              {industry.problems.map((problem) => (
                <p
                  key={problem}
                  className="flex items-start gap-3 rounded-xl bg-white/10 p-4 font-bold"
                >
                  <X className="mt-0.5 size-4 shrink-0 text-coral-100" />
                  {problem}
                </p>
              ))}
            </div>
          </div>
          <div>
            <SectionHeading
              align="left"
              eyebrow="Workflow examples"
              title={"Alur yang relevan untuk " + industry.name + "."}
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {industry.workflows.map((workflow, index) => (
                <article
                  key={workflow}
                  className="rounded-2xl border bg-cream-50 p-5"
                >
                  <span className="font-mono text-xs font-black text-coral-700">
                    0{index + 1}
                  </span>
                  <h3 className="mt-5 font-black">{workflow}</h3>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="marketing-section bg-cream-100">
        <div className="marketing-container">
          <SectionHeading
            eyebrow="Operational outcomes"
            title="Hasil yang lebih mudah dilihat dan dibuktikan."
          />
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
            {industry.outcomes.map((outcome) => (
              <article
                key={outcome}
                className="rounded-2xl border bg-white p-6 text-center"
              >
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-green-50 text-success">
                  <Check className="size-5" />
                </span>
                <h3 className="mt-5 font-black">{outcome}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>
      <FinalCTA
        title={"Bawa alur " + industry.name + " Anda ke satu sistem bukti."}
      />
    </main>
  );
}
