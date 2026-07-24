"use client";

import { useState } from "react";
import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  MapPin,
  MoreHorizontal,
  Smartphone,
} from "lucide-react";

const tabs = [
  { id: "dashboard", label: "Work order", icon: BarChart3 },
  { id: "mobile", label: "Checklist", icon: Smartphone },
  { id: "evidence", label: "Before & after", icon: ImageIcon },
  { id: "approval", label: "Approval", icon: FileCheck2 },
  { id: "report", label: "PDF report", icon: FileText },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ProductTour({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState<TabId>("dashboard");
  return (
    <div className="marketing-product-shell">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-coral-400" />
          <span className="size-2.5 rounded-full bg-cream-300" />
          <span className="size-2.5 rounded-full bg-success/60" />
        </div>
        <p className="text-xs font-extrabold text-muted">app.fieldproof.id</p>
        <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-extrabold text-green-800">
          ● Live
        </span>
      </div>
      <div
        className="marketing-product-tabs flex gap-1 overflow-x-auto border-b bg-cream-50 p-2"
        role="tablist"
        aria-label="Preview fitur produk"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active === id}
            aria-controls={"product-panel-" + id}
            onClick={() => setActive(id)}
            className={
              "marketing-product-tab inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-extrabold transition " +
              (active === id
                ? "bg-ink text-white shadow-sm"
                : "text-ink-soft hover:bg-white")
            }
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
      <div
        className={
          compact
            ? "min-h-80 bg-[#f8f3eb] p-4"
            : "min-h-[28rem] bg-[#f8f3eb] p-4 sm:p-6"
        }
      >
        {active === "dashboard" ? <DashboardPreview /> : null}
        {active === "mobile" ? <MobilePreview /> : null}
        {active === "evidence" ? <EvidencePreview /> : null}
        {active === "approval" ? <ApprovalPreview /> : null}
        {active === "report" ? <ReportPreview /> : null}
      </div>
    </div>
  );
}

function Panel({ id, children }: { id: TabId; children: React.ReactNode }) {
  return (
    <div
      id={"product-panel-" + id}
      role="tabpanel"
      className="marketing-preview-enter"
    >
      {children}
    </div>
  );
}

function DashboardPreview() {
  const rows = [
    [
      "WO-1842",
      "Lobby deep cleaning",
      "IN PROGRESS",
      "bg-amber-50 text-amber-800",
    ],
    [
      "WO-1843",
      "AC preventive maintenance",
      "ASSIGNED",
      "bg-indigo-50 text-indigo-700",
    ],
    [
      "WO-1844",
      "Pool area inspection",
      "SUBMITTED",
      "bg-violet-50 text-violet-700",
    ],
  ];
  return (
    <Panel id="dashboard">
      <div className="grid gap-4 lg:grid-cols-[1fr_17rem]">
        <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-coral-700">
                OPERATIONS
              </p>
              <h3 className="mt-1 text-xl font-black">Work order hari ini</h3>
            </div>
            <span className="rounded-xl bg-coral-600 px-3 py-2 text-xs font-bold text-white">
              + Buat tugas
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              ["24", "Aktif"],
              ["7", "Review"],
              ["96%", "Tepat waktu"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl bg-cream-50 p-3">
                <p className="text-xl font-black">{value}</p>
                <p className="text-[11px] font-bold text-muted">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border">
            {rows.map(([number, title, status, color]) => (
              <div
                key={number}
                className="flex items-center gap-3 border-b p-3 last:border-0"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-cream-100">
                  <ClipboardCheck className="size-4 text-coral-700" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{title}</p>
                  <p className="text-[11px] text-muted">{number} · Coral Bay</p>
                </div>
                <span
                  className={
                    "hidden rounded-full px-2 py-1 text-[9px] font-black sm:block " +
                    color
                  }
                >
                  {status}
                </span>
                <MoreHorizontal className="size-4 text-muted" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-ink p-5 text-white shadow-sm">
          <p className="text-xs font-extrabold text-coral-200">
            SLA MINGGU INI
          </p>
          <p className="mt-2 text-4xl font-black">96.4%</p>
          <div className="mt-5 flex h-28 items-end gap-2">
            {[48, 72, 58, 88, 76, 96, 84].map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-t-md bg-coral-400/80"
                style={{ height: height + "%" }}
              />
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-white/60">
            17 pekerjaan selesai tanpa revisi dalam 7 hari terakhir.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function MobilePreview() {
  return (
    <Panel id="mobile">
      <div className="mx-auto max-w-sm rounded-[2.25rem] border-[7px] border-ink bg-white p-3 shadow-xl">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-ink/20" />
        <div className="rounded-2xl bg-coral-600 p-4 text-white">
          <p className="text-[10px] font-extrabold text-coral-100">
            WO-1842 · IN PROGRESS
          </p>
          <h3 className="mt-1 font-black">Lobby deep cleaning</h3>
          <p className="mt-2 flex items-center gap-1 text-xs text-white/75">
            <MapPin className="size-3" /> Hotel Coral Bay
          </p>
        </div>
        <div className="mt-3 rounded-xl bg-cream-100 p-3">
          <div className="flex justify-between text-xs font-extrabold">
            <span>Progress checklist</span>
            <span>4 / 5</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white">
            <div className="h-2 w-4/5 rounded-full bg-coral-500" />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {[
            "Pasang safety sign",
            "Vacuum seluruh area",
            "Pel lantai",
            "Foto kondisi akhir",
          ].map((label, index) => (
            <div
              key={label}
              className="flex min-h-11 items-center gap-3 rounded-xl border px-3"
            >
              {index < 3 ? (
                <CheckCircle2 className="size-5 text-success" />
              ) : (
                <Circle className="size-5 text-muted" />
              )}
              <span className="text-xs font-bold">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-green-50 px-3 py-2 text-xs font-extrabold text-green-800">
          <span>● Online</span>
          <span>Draft tersimpan</span>
        </div>
      </div>
    </Panel>
  );
}

function EvidencePreview() {
  return (
    <Panel id="evidence">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-extrabold text-coral-700">
              EVIDENCE PAIR
            </p>
            <h3 className="mt-1 text-xl font-black">Kondisi lantai lobby</h3>
          </div>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold text-green-800">
            Terverifikasi
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <EvidenceFrame label="SEBELUM" tone="before" time="08:12" />
          <EvidenceFrame label="SESUDAH" tone="after" time="09:04" />
        </div>
        <div className="mt-4 grid gap-2 text-xs text-ink-soft sm:grid-cols-3">
          <p className="rounded-lg bg-cream-50 p-2.5">
            <strong className="text-ink">Lokasi</strong>
            <br />
            -6.2088, 106.8456
          </p>
          <p className="rounded-lg bg-cream-50 p-2.5">
            <strong className="text-ink">Petugas</strong>
            <br />
            Dewi Lestari
          </p>
          <p className="rounded-lg bg-cream-50 p-2.5">
            <strong className="text-ink">Checklist</strong>
            <br />
            Lobby cleaning v3
          </p>
        </div>
      </div>
    </Panel>
  );
}

function EvidenceFrame({
  label,
  tone,
  time,
}: {
  label: string;
  tone: "before" | "after";
  time: string;
}) {
  return (
    <div
      className={
        "relative aspect-[4/3] overflow-hidden rounded-xl " +
        (tone === "before" ? "bg-[#c7b6a6]" : "bg-[#e8d9c5]")
      }
    >
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/65 to-transparent" />
      <div
        className={
          "absolute left-[14%] right-[14%] top-[18%] h-[45%] rounded-t-xl border-[10px] " +
          (tone === "before"
            ? "border-[#81766d] bg-[#9f9287]"
            : "border-white/80 bg-[#d9c9b3]")
        }
      />
      <div
        className={
          "absolute bottom-[20%] left-[18%] right-[18%] h-[14%] rounded-full blur-sm " +
          (tone === "before" ? "bg-[#675e57]/70" : "bg-white/65")
        }
      />
      <span className="absolute left-3 top-3 rounded-full bg-ink/75 px-2.5 py-1 text-[10px] font-black text-white">
        {label}
      </span>
      <span className="absolute bottom-3 right-3 text-[10px] font-bold text-white">
        {time} WIB
      </span>
    </div>
  );
}

function ApprovalPreview() {
  return (
    <Panel id="approval">
      <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-[1fr_18rem]">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-extrabold text-coral-700">SUBMISSION #1</p>
          <h3 className="mt-1 text-xl font-black">Lobby deep cleaning</h3>
          <div className="mt-5 space-y-2">
            {[
              "Checklist 5/5 lengkap",
              "4 evidence tersinkronisasi",
              "Lokasi sesuai site",
              "Tanda tangan petugas",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl bg-cream-50 p-3 text-sm font-bold"
              >
                <Check className="size-4 text-success" /> {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-coral-200 bg-coral-50 p-5">
          <span className="grid size-11 place-items-center rounded-xl bg-coral-600 text-white">
            <FileCheck2 className="size-5" />
          </span>
          <h3 className="mt-5 text-lg font-black">Siap ditinjau</h3>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Semua bukti wajib telah lengkap. Supervisor dapat menyetujui atau
            meminta revisi.
          </p>
          <span className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl bg-success px-4 text-sm font-extrabold text-white">
            Setujui pekerjaan
          </span>
          <span className="mt-2 flex min-h-11 w-full items-center justify-center rounded-xl border bg-white px-4 text-sm font-extrabold">
            Minta revisi
          </span>
        </div>
      </div>
    </Panel>
  );
}

function ReportPreview() {
  return (
    <Panel id="report">
      <div className="mx-auto max-w-2xl rotate-[.4deg] rounded-sm bg-white p-6 shadow-[0_18px_50px_rgba(44,41,38,.16)] sm:p-8">
        <div className="flex items-start justify-between border-b-2 border-ink pb-5">
          <div>
            <p className="text-xs font-black tracking-widest text-coral-700">
              FIELDPROOF
            </p>
            <h3 className="mt-2 text-2xl font-black">Laporan Pekerjaan</h3>
            <p className="mt-1 text-xs text-muted">WO-1842 · 21 Juli 2026</p>
          </div>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-800">
            APPROVED
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
          {[
            ["Klien", "Hotel Coral Bay"],
            ["Lokasi", "Main Building"],
            ["Petugas", "Dewi Lestari"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="font-bold text-muted">{label}</p>
              <p className="mt-1 font-extrabold">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl bg-cream-50 p-4">
          <div className="flex items-center justify-between text-xs">
            <strong>Checklist selesai</strong>
            <strong>5 / 5</strong>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <EvidenceFrame label="SEBELUM" tone="before" time="08:12" />
            <EvidenceFrame label="SESUDAH" tone="after" time="09:04" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t pt-4 text-[10px] text-muted">
          <span>Generated by FieldProof</span>
          <span>Revision 1 · Verified record</span>
        </div>
      </div>
    </Panel>
  );
}

export function MiniWorkflow() {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      {["Ditugaskan", "Dikerjakan", "Direview", "Dilaporkan"].map(
        (item, index) => (
          <div key={item} className="contents">
            <div className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border bg-white px-3 text-sm font-extrabold">
              <span className="grid size-7 place-items-center rounded-lg bg-coral-100 text-xs text-coral-800">
                {index + 1}
              </span>
              {item}
            </div>
            {index < 3 ? (
              <ChevronRight className="mx-auto hidden size-4 text-coral-400 sm:block" />
            ) : null}
          </div>
        ),
      )}
    </div>
  );
}
