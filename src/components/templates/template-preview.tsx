import { Camera, MapPin, ScanLine, Signature } from "lucide-react";
import type { ChecklistField, ChecklistSchema } from "@/modules/templates/validation";

function FieldPreview({ field }: { field: ChecklistField }) {
  const base = <div className="min-h-11 rounded-xl border bg-white px-4 py-3 text-sm text-muted">{field.placeholder || "Jawaban petugas"}</div>;
  let control = base;
  if (["CHECKBOX", "PASS_FAIL_NA", "SINGLE_SELECT", "MULTI_SELECT"].includes(field.type)) control = <div className="flex flex-wrap gap-2">{(field.options.length ? field.options : field.type === "PASS_FAIL_NA" ? ["Pass", "Fail", "N/A"] : ["Ya", "Tidak"]).map((option)=><span key={option} className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold">{option}</span>)}</div>;
  if (field.type === "RATING") control = <div className="text-2xl tracking-widest text-coral-500">☆ ☆ ☆ ☆ ☆</div>;
  if (field.type === "PHOTO") control = <div className="grid min-h-24 place-items-center rounded-xl border border-dashed bg-white text-muted"><Camera className="size-6"/><span className="text-xs">Ambil foto</span></div>;
  if (field.type === "SIGNATURE") control = <div className="grid min-h-24 place-items-center rounded-xl border bg-white text-muted"><Signature className="size-6"/><span className="text-xs">Area tanda tangan</span></div>;
  if (field.type === "GPS") control = <div className="flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm text-muted"><MapPin className="size-5"/>Ambil lokasi perangkat</div>;
  if (field.type === "BARCODE_QR") control = <div className="flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm text-muted"><ScanLine className="size-5"/>Scan barcode / QR</div>;
  if (field.type === "SECTION_HEADING") return <h3 className="text-lg font-extrabold">{field.label}</h3>;
  if (field.type === "INSTRUCTION") return <p className="rounded-xl bg-cream-100 p-4 text-sm text-ink-soft">{field.label}</p>;
  return <div><p className="mb-2 text-sm font-bold">{field.label}{field.required?<span className="ml-1 text-danger">*</span>:null}</p>{field.description?<p className="mb-2 text-xs text-ink-soft">{field.description}</p>:null}{control}</div>;
}

export function TemplatePreview({ schema, mode = "mobile" }: { schema: ChecklistSchema; mode?: "mobile" | "report" }) {
  return <div className={mode === "mobile" ? "mx-auto max-w-md overflow-hidden rounded-[2rem] border-8 border-ink bg-cream-50 shadow-xl" : "mx-auto max-w-3xl rounded-2xl border bg-white p-8 shadow-sm"}><div className={mode === "mobile" ? "max-h-[70vh] overflow-y-auto p-5" : ""}>{schema.sections.map((section, index)=><section key={section.id} className="mb-7 break-inside-avoid"><div className="mb-4 border-b border-coral-200 pb-3"><p className="text-xs font-extrabold uppercase tracking-widest text-coral-700">Bagian {index+1}</p><h2 className="mt-1 text-xl font-extrabold">{section.title}</h2>{section.description?<p className="mt-1 text-sm text-ink-soft">{section.description}</p>:null}</div><div className="space-y-5">{section.fields.map((field)=><FieldPreview key={field.id} field={field}/>)}</div></section>)}</div></div>;
}
