import Link from "next/link";
import { ArrowRight, Check, MoveRight } from "lucide-react";
import { faqItems, features, industries, pricingPlans } from "./marketing-data";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  inverse = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  inverse?: boolean;
}) {
  return (
    <div
      className={
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"
      }
    >
      <p
        className={
          "marketing-eyebrow " +
          (inverse ? "border-white/15 bg-white/10 text-coral-200" : "")
        }
      >
        {eyebrow}
      </p>
      <h2
        className={
          "mt-4 text-balance text-3xl font-black leading-tight tracking-[-0.035em] sm:text-5xl " +
          (inverse ? "text-white" : "")
        }
      >
        {title}
      </h2>
      {description ? (
        <p
          className={
            "mt-5 text-pretty text-lg leading-8 " +
            (inverse ? "text-white/65" : "text-ink-soft")
          }
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function FeatureGrid({ limit }: { limit?: number }) {
  return (
    <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {features
        .slice(0, limit)
        .map(({ icon: Icon, title, description }, index) => (
          <article
            key={title}
            className="group bg-white p-6 transition hover:bg-cream-50 sm:p-7"
          >
            <div className="flex items-start justify-between">
              <span className="grid size-12 place-items-center rounded-2xl bg-coral-100 text-coral-800 transition group-hover:-rotate-3 group-hover:bg-coral-600 group-hover:text-white">
                <Icon className="size-5" />
              </span>
              <span className="font-mono text-xs font-bold text-muted">
                0{index + 1}
              </span>
            </div>
            <h3 className="mt-6 text-lg font-black">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              {description}
            </p>
          </article>
        ))}
    </div>
  );
}

export function IndustryGrid() {
  return (
    <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {industries.map(({ slug, name, icon: Icon, short }, index) => (
        <Link
          key={slug}
          href={"/industries/" + slug}
          className={
            "group relative overflow-hidden rounded-3xl border p-6 transition hover:-translate-y-1 hover:border-coral-300 hover:shadow-xl " +
            (index === 0 ? "bg-coral-600 text-white" : "bg-white")
          }
        >
          <div className="flex items-start justify-between">
            <span
              className={
                "grid size-12 place-items-center rounded-2xl " +
                (index === 0
                  ? "bg-white/15 text-white"
                  : "bg-cream-100 text-coral-700")
              }
            >
              <Icon className="size-5" />
            </span>
            <ArrowRight className="size-5 transition group-hover:translate-x-1" />
          </div>
          <h3 className="mt-8 text-xl font-black">{name}</h3>
          <p
            className={
              "mt-3 text-sm leading-6 " +
              (index === 0 ? "text-white/75" : "text-ink-soft")
            }
          >
            {short}
          </p>
        </Link>
      ))}
    </div>
  );
}

export function PricingCards({
  showHeading = true,
}: {
  showHeading?: boolean;
}) {
  return (
    <>
      {showHeading ? (
        <SectionHeading
          eyebrow="Pricing"
          title="Mulai sederhana. Bertumbuh tanpa kehilangan kontrol."
          description="Pilih kapasitas yang sesuai dengan skala operasional Anda. Tidak ada testimonial atau angka keberhasilan yang dibuat-buat."
        />
      ) : null}
      <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <article
            key={plan.name}
            className={
              "relative flex flex-col rounded-3xl border p-7 sm:p-8 " +
              ("featured" in plan && plan.featured
                ? "border-coral-500 bg-ink text-white shadow-[0_24px_70px_rgba(44,41,38,.18)]"
                : "bg-white")
            }
          >
            {"featured" in plan && plan.featured ? (
              <span className="absolute right-5 top-0 -translate-y-1/2 rounded-full bg-coral-500 px-3 py-1 text-xs font-black text-white">
                PALING POPULER
              </span>
            ) : null}
            <p
              className={
                "text-sm font-black uppercase tracking-widest " +
                ("featured" in plan && plan.featured
                  ? "text-coral-200"
                  : "text-coral-700")
              }
            >
              {plan.name}
            </p>
            <p className="mt-4 text-3xl font-black">{plan.price}</p>
            <p
              className={
                "mt-3 min-h-12 text-sm leading-6 " +
                ("featured" in plan && plan.featured
                  ? "text-white/65"
                  : "text-ink-soft")
              }
            >
              {plan.description}
            </p>
            <ul
              className="mt-7 flex-1 space-y-3"
              aria-label={"Fitur paket " + plan.name}
            >
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-sm font-bold"
                >
                  <span
                    className={
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full " +
                      ("featured" in plan && plan.featured
                        ? "bg-coral-500 text-white"
                        : "bg-coral-100 text-coral-800")
                    }
                  >
                    <Check className="size-3" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={
                "mt-8 inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-black transition " +
                ("featured" in plan && plan.featured
                  ? "bg-coral-500 text-white hover:bg-coral-400"
                  : "bg-ink text-white hover:bg-coral-700")
              }
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}

export function FAQ() {
  return (
    <div className="mx-auto mt-12 max-w-3xl divide-y rounded-3xl border bg-white px-6 sm:px-8">
      {faqItems.map(([question, answer], index) => (
        <details key={question} className="group py-5" open={index === 0}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-5 font-extrabold [&::-webkit-details-marker]:hidden">
            {question}
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream-100 text-coral-800 transition group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="max-w-2xl pb-2 pr-10 text-sm leading-7 text-ink-soft">
            {answer}
          </p>
        </details>
      ))}
    </div>
  );
}

export function FinalCTA({
  title = "Buat bukti kerja menjadi standar operasional, bukan pekerjaan tambahan.",
  description = "Mulai dari satu tim dan satu template. FieldProof membantu setiap pekerjaan selesai dengan bukti yang jelas.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="marketing-container py-20 sm:py-28">
      <div className="relative overflow-hidden rounded-[2rem] bg-coral-600 px-6 py-14 text-center text-white shadow-[0_24px_80px_rgba(198,83,66,.22)] sm:px-12 sm:py-20">
        <div className="absolute -left-20 -top-20 size-64 rounded-full border-[40px] border-white/10" />
        <div className="absolute -bottom-32 -right-20 size-80 rounded-full border-[50px] border-ink/10" />
        <div className="relative">
          <p className="text-sm font-black uppercase tracking-[.18em] text-coral-100">
            Siap merapikan operasional?
          </p>
          <h2 className="mx-auto mt-5 max-w-4xl text-balance text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty leading-7 text-white/75">
            {description}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className="marketing-button-light">
              Mulai Gratis <ArrowRight className="size-4" />
            </Link>
            <Link href="/request-demo" className="marketing-button-on-coral">
              Jadwalkan Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function InlineLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 font-extrabold text-coral-700 hover:text-coral-900"
    >
      {children} <MoveRight className="size-4" />
    </Link>
  );
}
