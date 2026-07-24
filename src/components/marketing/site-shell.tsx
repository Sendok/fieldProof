import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Instagram,
  Linkedin,
  Menu,
} from "lucide-react";

const navigation = [
  ["/features", "Fitur"],
  ["/industries", "Industri"],
  ["/pricing", "Harga"],
  ["/demo", "Demo Produk"],
] as const;

export function AnnouncementBar() {
  return (
    <div className="bg-ink px-5 py-2.5 text-center text-xs font-bold tracking-wide text-white sm:text-sm">
      <span className="text-coral-200">Baru:</span> Dokumentasi bukti kerja,
      dari lapangan sampai laporan klien.{" "}
      <Link
        href="/features"
        className="ml-1 inline-flex items-center gap-1 underline decoration-coral-300 underline-offset-4"
      >
        Lihat kemampuan FieldProof <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-cream-50/92 backdrop-blur-xl">
      <div className="marketing-container flex min-h-18 items-center justify-between gap-6">
        <Brand />
        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label="Navigasi utama"
        >
          {navigation.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-bold text-ink-soft transition hover:text-coral-700"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center px-3 text-sm font-extrabold text-ink hover:text-coral-700"
          >
            Login
          </Link>
          <Link
            href="/request-demo"
            className="marketing-button-secondary py-2.5"
          >
            Jadwalkan Demo
          </Link>
          <Link href="/register" className="marketing-button-primary py-2.5">
            Mulai Gratis
          </Link>
        </div>
        <details className="group relative lg:hidden">
          <summary className="grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded-xl border bg-white [&::-webkit-details-marker]:hidden">
            <Menu className="size-5 group-open:hidden" aria-hidden="true" />
            <ChevronDown
              className="hidden size-5 group-open:block"
              aria-hidden="true"
            />
            <span className="sr-only">Buka menu</span>
          </summary>
          <nav
            className="absolute right-0 top-14 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border bg-white p-3 shadow-2xl"
            aria-label="Navigasi seluler"
          >
            {navigation.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="block min-h-11 rounded-xl px-4 py-3 font-bold hover:bg-cream-100"
              >
                {label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2 border-t pt-3">
              <Link href="/login" className="marketing-button-secondary">
                Login
              </Link>
              <Link href="/request-demo" className="marketing-button-secondary">
                Jadwalkan Demo
              </Link>
              <Link href="/register" className="marketing-button-primary">
                Mulai Gratis
              </Link>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={
        "inline-flex items-center gap-2.5 text-xl font-black tracking-[-0.03em] " +
        (inverse ? "text-white" : "text-ink")
      }
      aria-label="FieldProof — halaman utama"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-coral-600 text-white shadow-[0_6px_20px_rgba(198,83,66,.28)]">
        <CheckCircle2 className="size-5" aria-hidden="true" />
      </span>
      FieldProof
    </Link>
  );
}

export function MarketingFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="marketing-container grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Brand inverse />
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">
            Bukti kerja lapangan yang terstruktur, dapat diverifikasi, dan siap
            dilaporkan kepada klien.
          </p>
          <p className="mt-5 text-sm font-bold text-coral-200">
            Dipercaya oleh tim operasional yang membutuhkan bukti pekerjaan
            lebih rapi.
          </p>
        </div>
        <FooterColumn
          title="Produk"
          links={[
            ["/features", "Fitur"],
            ["/pricing", "Harga"],
            ["/demo", "Demo Produk"],
            ["/request-demo", "Request Demo"],
          ]}
        />
        <FooterColumn
          title="Industri"
          links={[
            ["/industries/cleaning-service", "Cleaning Service"],
            ["/industries/property-management", "Property Management"],
            ["/industries/contractor", "Contractor"],
            ["/industries/maintenance", "Maintenance"],
          ]}
        />
        <div>
          <h2 className="text-sm font-extrabold text-white">Akses</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/65">
            <Link href="/login" className="hover:text-white">
              Login
            </Link>
            <Link href="/register" className="hover:text-white">
              Mulai Gratis
            </Link>
            <Link href="/api/health" className="hover:text-white">
              System status
            </Link>
          </div>
          <div className="mt-6 flex gap-2" aria-label="Media sosial">
            <span
              className="grid size-10 place-items-center rounded-xl border border-white/15 text-white/60"
              title="LinkedIn segera hadir"
            >
              <Linkedin className="size-4" />
            </span>
            <span
              className="grid size-10 place-items-center rounded-xl border border-white/15 text-white/60"
              title="Instagram segera hadir"
            >
              <Instagram className="size-4" />
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="marketing-container flex flex-col gap-3 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} FieldProof. Seluruh hak cipta
            dilindungi.
          </p>
          <p>Dibangun untuk operasional lapangan Indonesia.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly (readonly [string, string])[];
}) {
  return (
    <div>
      <h2 className="text-sm font-extrabold text-white">{title}</h2>
      <div className="mt-4 grid gap-3 text-sm text-white/65">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="hover:text-white">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="marketing-grid-bg overflow-hidden border-b">
      <div className="marketing-container py-20 text-center sm:py-28">
        <p className="marketing-eyebrow">{eyebrow}</p>
        <h1 className="mx-auto mt-5 max-w-4xl text-balance text-4xl font-black leading-[1.08] tracking-[-0.045em] sm:text-6xl">
          {title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-ink-soft">
          {description}
        </p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
