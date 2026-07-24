import type { ChecklistField, ChecklistFieldType, ChecklistSchema } from "./validation";

type BuiltInTemplate = { name: string; description: string; industry: string; category: string; estimatedMinutes: number; schema: ChecklistSchema };

const field = (prefix: string, index: number, type: ChecklistFieldType, label: string, extra: Partial<ChecklistField> = {}): ChecklistField => ({
  id: `${prefix}-f${index}`, type, label, required: !["SECTION_HEADING", "INSTRUCTION"].includes(type), options: [], visibleInReport: true, ...extra,
});

function schema(prefix: string, sections: Array<{ title: string; fields: ChecklistField[] }>): ChecklistSchema {
  const evidenceFields = sections.flatMap((section) => section.fields).filter((item) => item.required && ["PHOTO", "GPS", "SIGNATURE"].includes(item.type));
  return {
    schemaVersion: 1,
    sections: sections.map((section, index) => ({ id: `${prefix}-s${index + 1}`, ...section })),
    evidenceRules: evidenceFields.map((item, index) => ({
      id: `${prefix}-r${index + 1}`,
      type: item.type === "PHOTO" ? "MIN_PHOTOS" : item.type === "GPS" ? "REQUIRE_GPS" : "REQUIRE_SIGNATURE",
      fieldId: item.id,
      ...(item.type === "PHOTO" ? { minCount: 1 } : {}),
    })),
  };
}

export const builtInTemplates: BuiltInTemplate[] = [
  { name: "Cleaning Service Daily Checklist", description: "Checklist harian layanan kebersihan dengan bukti sebelum dan sesudah.", industry: "Cleaning Service", category: "Daily Operations", estimatedMinutes: 25, schema: schema("clean", [
    { title: "Check-in", fields: [field("clean", 1, "DATETIME", "Waktu check-in"), field("clean", 2, "GPS", "Lokasi check-in"), field("clean", 3, "PHOTO", "Foto sebelum", { allowedFileCount: 5, photoCategory: "BEFORE" })] },
    { title: "Pemeriksaan kebersihan", fields: [field("clean", 4, "PASS_FAIL_NA", "Kebersihan lantai"), field("clean", 5, "PASS_FAIL_NA", "Kebersihan kaca"), field("clean", 6, "PASS_FAIL_NA", "Kebersihan toilet"), field("clean", 7, "PASS_FAIL_NA", "Tempat sampah sudah dikosongkan")] },
    { title: "Penyelesaian", fields: [field("clean", 8, "PHOTO", "Foto sesudah", { allowedFileCount: 5, photoCategory: "AFTER" }), field("clean", 9, "LONG_TEXT", "Catatan", { required: false }), field("clean", 10, "SIGNATURE", "Tanda tangan petugas")] },
  ]) },
  { name: "Property Inspection", description: "Inspeksi kondisi properti dan dokumentasi kerusakan.", industry: "Property Management", category: "Inspection", estimatedMinutes: 35, schema: schema("property", [
    { title: "Elemen bangunan", fields: [field("property", 1, "PASS_FAIL_NA", "Kondisi pintu"), field("property", 2, "PASS_FAIL_NA", "Kondisi jendela"), field("property", 3, "PASS_FAIL_NA", "Kelistrikan"), field("property", 4, "PASS_FAIL_NA", "Air dan plumbing")] },
    { title: "Kondisi interior", fields: [field("property", 5, "PASS_FAIL_NA", "Kondisi dinding"), field("property", 6, "PASS_FAIL_NA", "Kondisi furnitur"), field("property", 7, "PHOTO", "Damage photo", { required: false, allowedFileCount: 10, photoCategory: "DAMAGE" }), field("property", 8, "LONG_TEXT", "Notes", { required: false })] },
  ]) },
  { name: "Maintenance Visit", description: "Dokumentasi kunjungan maintenance dari diagnosis sampai final test.", industry: "Facilities", category: "Maintenance", estimatedMinutes: 45, schema: schema("maintenance", [
    { title: "Identifikasi", fields: [field("maintenance", 1, "BARCODE_QR", "Machine identity"), field("maintenance", 2, "LONG_TEXT", "Initial condition"), field("maintenance", 3, "LONG_TEXT", "Diagnosis")] },
    { title: "Pekerjaan", fields: [field("maintenance", 4, "LONG_TEXT", "Action performed"), field("maintenance", 5, "LONG_TEXT", "Parts replaced", { required: false }), field("maintenance", 6, "PASS_FAIL_NA", "Final test")] },
    { title: "Persetujuan", fields: [field("maintenance", 7, "SIGNATURE", "Technician signature"), field("maintenance", 8, "SIGNATURE", "Client signature")] },
  ]) },
  { name: "Contractor Daily Progress", description: "Laporan kemajuan harian kontraktor dengan bukti foto bertahap.", industry: "Construction", category: "Daily Progress", estimatedMinutes: 30, schema: schema("contractor", [
    { title: "Kondisi lapangan", fields: [field("contractor", 1, "SINGLE_SELECT", "Weather", { options: ["Cerah", "Berawan", "Hujan", "Cuaca ekstrem"] }), field("contractor", 2, "NUMBER", "Manpower", { min: 0 }), field("contractor", 3, "LONG_TEXT", "Work completed"), field("contractor", 4, "LONG_TEXT", "Material used")] },
    { title: "Safety dan issue", fields: [field("contractor", 5, "PASS_FAIL_NA", "Safety checklist"), field("contractor", 6, "LONG_TEXT", "Issue", { required: false })] },
    { title: "Progress photos", fields: [field("contractor", 7, "PHOTO", "Before photo", { allowedFileCount: 5, photoCategory: "BEFORE" }), field("contractor", 8, "PHOTO", "During photo", { allowedFileCount: 5, photoCategory: "DURING" }), field("contractor", 9, "PHOTO", "After photo", { allowedFileCount: 5, photoCategory: "AFTER" })] },
  ]) },
  { name: "Sales Visit Report", description: "Laporan kunjungan sales, potensi order, dan rencana tindak lanjut.", industry: "Sales & Distribution", category: "Visit Report", estimatedMinutes: 20, schema: schema("sales", [
    { title: "Outlet", fields: [field("sales", 1, "RATING", "Outlet condition", { min: 1, max: 5 }), field("sales", 2, "SHORT_TEXT", "Contact person"), field("sales", 3, "MULTI_SELECT", "Product availability", { options: ["Tersedia lengkap", "Stok terbatas", "Tidak tersedia"] }), field("sales", 4, "LONG_TEXT", "Competitor information", { required: false })] },
    { title: "Opportunity", fields: [field("sales", 5, "SINGLE_SELECT", "Order potential", { options: ["Rendah", "Sedang", "Tinggi"] }), field("sales", 6, "PHOTO", "Visit photo", { allowedFileCount: 5, photoCategory: "VISIT" }), field("sales", 7, "DATE", "Follow-up date"), field("sales", 8, "LONG_TEXT", "Visit notes", { required: false })] },
  ]) },
];
