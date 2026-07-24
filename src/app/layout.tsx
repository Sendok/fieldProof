import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./styles-v2.css";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  applicationName: "FieldProof",
  title: {
    default: "FieldProof — Bukti Kerja Lapangan yang Rapi",
    template: "%s | FieldProof",
  },
  description:
    "Kelola tugas, checklist, foto sebelum-sesudah, approval supervisor, dan laporan klien dalam satu platform.",
  keywords: [
    "field service management",
    "work order",
    "checklist digital",
    "bukti pekerjaan",
    "laporan pekerjaan",
    "operasional lapangan",
  ],
  authors: [{ name: "FieldProof" }],
  creator: "FieldProof",
  publisher: "FieldProof",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "FieldProof",
    title: "Bukti Kerja Lapangan yang Tidak Lagi Berantakan.",
    description:
      "Kelola tugas, checklist, foto sebelum-sesudah, approval supervisor, dan laporan klien dalam satu platform.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "FieldProof — bukti kerja lapangan yang tidak lagi berantakan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bukti Kerja Lapangan yang Tidak Lagi Berantakan.",
    description:
      "Work order, checklist, evidence, approval, dan laporan klien dalam satu platform.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${manrope.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
