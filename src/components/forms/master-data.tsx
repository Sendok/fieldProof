export const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-base outline-none focus:border-coral-600 focus:ring-3 focus:ring-coral-100";

export function FormField({ label, name, defaultValue, type = "text", required = false, placeholder }: { label: string; name: string; defaultValue?: string | number | null; type?: string; required?: boolean; placeholder?: string }) {
  return <label className="block text-sm font-bold text-ink">{label}<input className={inputClass} name={name} defaultValue={defaultValue ?? ""} type={type} required={required} placeholder={placeholder} /></label>;
}

export function TextAreaField({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string | null }) {
  return <label className="block text-sm font-bold text-ink">{label}<textarea className={`${inputClass} min-h-24 py-3`} name={name} defaultValue={defaultValue ?? ""} /></label>;
}

export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header><p className="text-xs font-extrabold uppercase tracking-[.16em] text-coral-700">{eyebrow}</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{title}</h1><p className="mt-2 max-w-2xl text-ink-soft">{description}</p></header>;
}

export function Submit({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  return <button type="submit" className={`min-h-11 rounded-xl px-5 font-bold text-white ${danger ? "bg-danger" : "bg-coral-600 hover:bg-coral-700"}`}>{children}</button>;
}
