import {
  BarChart3,
  Building2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  HardHat,
  History,
  House,
  Image as ImageIcon,
  ListChecks,
  ScanSearch,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Wrench,
} from "lucide-react";

export const features = [
  {
    icon: ClipboardCheck,
    title: "Work Order Management",
    description:
      "Buat, jadwalkan, tugaskan, dan pantau pekerjaan dari satu pusat kendali.",
  },
  {
    icon: ListChecks,
    title: "Digital Checklist",
    description:
      "Standarkan langkah kerja dengan field wajib dan validasi yang jelas.",
  },
  {
    icon: ImageIcon,
    title: "Before & After Evidence",
    description:
      "Pasangkan foto sebelum dan sesudah dengan waktu, lokasi, dan pekerjaan.",
  },
  {
    icon: Smartphone,
    title: "Offline Draft",
    description:
      "Petugas tetap dapat mengisi draft saat koneksi lapangan tidak stabil.",
  },
  {
    icon: FileCheck2,
    title: "Supervisor Approval",
    description:
      "Review bukti, minta revisi, atau setujui pekerjaan dengan jejak keputusan.",
  },
  {
    icon: FileText,
    title: "Client Report",
    description:
      "Ubah data pekerjaan menjadi laporan profesional yang siap dibagikan.",
  },
  {
    icon: History,
    title: "Audit Trail",
    description:
      "Catat perubahan status, aktor, waktu, dan revision tanpa kehilangan konteks.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Lihat volume, keterlambatan, penyelesaian, dan kualitas operasional.",
  },
] as const;

export type Industry = {
  slug: string;
  name: string;
  icon: typeof Sparkles;
  short: string;
  headline: string;
  description: string;
  problems: string[];
  workflows: string[];
  outcomes: string[];
};

export const industries: Industry[] = [
  {
    slug: "cleaning-service",
    name: "Cleaning Service",
    icon: Sparkles,
    short: "Buktikan area sudah dibersihkan sesuai checklist dan SLA.",
    headline: "Bukti cleaning yang rapi untuk setiap area, shift, dan klien.",
    description:
      "FieldProof membantu perusahaan cleaning mengendalikan pekerjaan rutin dan deep cleaning tanpa mengejar foto di grup chat.",
    problems: [
      "Foto tersebar di banyak grup",
      "Standar kebersihan berbeda antar petugas",
      "Laporan bulanan memakan waktu",
    ],
    workflows: [
      "Daily cleaning checklist",
      "Before-after tiap area",
      "Temuan dan tindakan korektif",
      "Supervisor sign-off",
    ],
    outcomes: [
      "Bukti SLA lebih mudah diverifikasi",
      "Komplain memiliki konteks pekerjaan",
      "Laporan klien lebih cepat",
    ],
  },
  {
    slug: "property-management",
    name: "Property Management",
    icon: Building2,
    short: "Pantau inspeksi gedung, vendor, dan tindak lanjut tenant.",
    headline: "Satu jejak operasional untuk gedung, vendor, dan tenant.",
    description:
      "Kelola inspeksi fasilitas, pekerjaan vendor, dan isu tenant dengan bukti yang terhubung ke lokasi serta aset.",
    problems: [
      "Pekerjaan vendor sulit dipantau",
      "Temuan inspeksi tidak cepat ditindaklanjuti",
      "Riwayat per lokasi terfragmentasi",
    ],
    workflows: [
      "Building inspection",
      "Vendor work verification",
      "Common area checklist",
      "Issue escalation",
    ],
    outcomes: [
      "Visibilitas lintas properti",
      "Vendor lebih akuntabel",
      "Riwayat lokasi mudah ditelusuri",
    ],
  },
  {
    slug: "contractor",
    name: "Contractor",
    icon: HardHat,
    short: "Dokumentasikan progres, kualitas, dan serah terima pekerjaan.",
    headline:
      "Progres lapangan yang dapat dibuktikan, bukan sekadar dilaporkan.",
    description:
      "Hubungkan setiap checklist, foto progres, temuan, dan persetujuan dengan paket pekerjaan yang tepat.",
    problems: [
      "Progres sulit diverifikasi dari kantor",
      "Dokumentasi serah terima tidak konsisten",
      "Bukti perubahan pekerjaan tercecer",
    ],
    workflows: [
      "Site progress update",
      "Quality checklist",
      "Defect documentation",
      "Handover evidence",
    ],
    outcomes: [
      "Progres lebih transparan",
      "Serah terima lebih tertib",
      "Sengketa bukti berkurang",
    ],
  },
  {
    slug: "maintenance",
    name: "Maintenance",
    icon: Wrench,
    short: "Standarkan preventive dan corrective maintenance di lapangan.",
    headline: "Setiap tindakan maintenance memiliki checklist dan bukti.",
    description:
      "Dari preventive maintenance hingga pekerjaan darurat, FieldProof menjaga catatan tindakan tetap lengkap dan dapat diaudit.",
    problems: [
      "Checklist teknisi sering tidak lengkap",
      "Kondisi sebelum perbaikan tidak terdokumentasi",
      "Riwayat pekerjaan sulit ditemukan",
    ],
    workflows: [
      "Preventive maintenance",
      "Corrective work order",
      "Asset condition evidence",
      "Technician sign-off",
    ],
    outcomes: [
      "Kepatuhan checklist meningkat",
      "Diagnosis memiliki histori",
      "Supervisor cepat melihat exception",
    ],
  },
  {
    slug: "field-sales",
    name: "Field Sales",
    icon: ShoppingBag,
    short: "Verifikasi kunjungan, display, dan aktivitas outlet.",
    headline: "Aktivitas outlet yang terbukti dan mudah dianalisis.",
    description:
      "Standarkan kunjungan lapangan, bukti display, serta catatan tindak lanjut untuk setiap outlet.",
    problems: [
      "Kunjungan sulit diverifikasi",
      "Bukti display tidak konsisten",
      "Laporan area lambat",
    ],
    workflows: [
      "Outlet visit",
      "Display evidence",
      "Stock observation",
      "Follow-up task",
    ],
    outcomes: [
      "Coverage lebih transparan",
      "Bukti outlet terstruktur",
      "Tindak lanjut lebih cepat",
    ],
  },
  {
    slug: "inspection-service",
    name: "Inspection Service",
    icon: ScanSearch,
    short: "Jalankan inspeksi konsisten dengan temuan yang dapat diaudit.",
    headline: "Inspeksi konsisten, temuan jelas, bukti siap ditinjau.",
    description:
      "Bangun checklist inspeksi yang terstandardisasi dan hasilkan catatan bukti yang siap dibagikan.",
    problems: [
      "Format inspeksi berbeda-beda",
      "Bukti temuan tanpa konteks",
      "Review membutuhkan rekap manual",
    ],
    workflows: [
      "Structured inspection",
      "Finding evidence",
      "Corrective recommendation",
      "Reviewer approval",
    ],
    outcomes: [
      "Konsistensi inspeksi",
      "Temuan lebih dapat ditelusuri",
      "Review lebih singkat",
    ],
  },
];

export const pricingPlans = [
  {
    name: "Starter",
    description: "Untuk tim kecil yang mulai menertibkan bukti kerja.",
    price: "Mulai gratis",
    features: [
      "5 anggota",
      "100 pekerjaan per bulan",
      "3 template",
      "Basic report",
    ],
    cta: "Mulai Gratis",
    href: "/register",
  },
  {
    name: "Growth",
    description: "Untuk operasi yang membutuhkan kontrol dan skala.",
    price: "Hubungi kami",
    features: [
      "25 anggota",
      "1.000 pekerjaan per bulan",
      "Unlimited templates",
      "Custom branding",
      "Client portal",
      "Advanced analytics",
    ],
    cta: "Jadwalkan Demo",
    href: "/request-demo?plan=growth",
    featured: true,
  },
  {
    name: "Business",
    description: "Untuk organisasi dengan proses dan kebutuhan khusus.",
    price: "Kustom",
    features: [
      "Custom members",
      "Custom quota",
      "API access",
      "Advanced audit",
      "Priority support",
    ],
    cta: "Bicara dengan Tim Kami",
    href: "/request-demo?plan=business",
  },
] as const;

export const faqItems = [
  [
    "Apakah petugas harus menginstal aplikasi?",
    "Tidak. FieldProof dapat digunakan langsung melalui browser HP. PWA dapat ditambahkan ke home screen tanpa app store.",
  ],
  [
    "Bagaimana jika koneksi di lokasi tidak stabil?",
    "Jawaban checklist dan evidence queue disimpan sebagai draft di perangkat. Sinkronisasi dapat dilanjutkan ketika koneksi tersedia kembali.",
  ],
  [
    "Apakah foto tersimpan dengan aman?",
    "Evidence disimpan pada object storage private. Akses download diberikan melalui tautan sementara setelah pemeriksaan organisasi dan hak akses.",
  ],
  [
    "Apakah checklist dapat disesuaikan?",
    "Ya. Tim dapat membuat template, menyusun field, melihat preview, dan menerbitkan versi immutable agar work order lama tetap konsisten.",
  ],
  [
    "Bisakah klien menerima laporan?",
    "FieldProof dirancang untuk menghasilkan laporan yang menggabungkan detail pekerjaan, checklist, evidence, approval, dan jejak audit dalam format yang mudah dibagikan.",
  ],
  [
    "Apakah FieldProof cocok untuk banyak cabang?",
    "Ya. Model organisasi, client, site, team, dan membership memisahkan akses serta data operasional secara terstruktur.",
  ],
] as const;

export const securityPoints = [
  {
    icon: ShieldCheck,
    title: "Tenant isolation",
    text: "Data organisasi dibatasi pada setiap query dan mutation.",
  },
  {
    icon: House,
    title: "Private evidence",
    text: "File bukti tidak dibuka sebagai public object.",
  },
  {
    icon: History,
    title: "Immutable history",
    text: "Submission dan revision mempertahankan jejak perubahan.",
  },
] as const;
