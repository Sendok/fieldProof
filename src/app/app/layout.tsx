import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, BriefcaseBusiness, Building2, CheckCircle2, ClipboardCheck, ClipboardList, LayoutDashboard, MapPin, ScrollText, Settings, UserRoundCog, Users } from "lucide-react";
import { auth } from "@/server/auth";
import { SyncIndicator } from "@/components/pwa/sync-indicator";
import { PrivateCacheScope } from "@/components/pwa/private-cache-scope";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const nav = [["/app/dashboard", "Dashboard", LayoutDashboard], ["/app/my-tasks/today", "My tasks", ClipboardCheck], ["/app/work-orders", "Work orders", BriefcaseBusiness], ["/app/clients", "Clients", Building2], ["/app/sites", "Sites", MapPin], ["/app/templates", "Templates", ClipboardList], ["/app/teams", "Teams", Users], ["/app/members", "Anggota", UserRoundCog], ["/app/notifications", "Notifications", Bell], ["/app/audit-log", "Audit log", ScrollText], ["/app/settings/organization", "Pengaturan", Settings]] as const;
  return <div className="min-h-screen bg-cream-50"><PrivateCacheScope userId={session.user.id!}/><header className="border-b border-border bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4"><Link href="/app/dashboard" className="flex items-center gap-2 text-xl font-extrabold"><span className="grid size-9 place-items-center rounded-xl bg-coral-600 text-white"><CheckCircle2 className="size-5" /></span>FieldProof</Link><div className="flex items-center gap-3"><SyncIndicator/><span className="hidden text-sm font-semibold text-ink-soft sm:inline">{session.user.email}</span></div></div></header><div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:grid-cols-[220px_1fr]"><nav className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible" aria-label="Navigasi aplikasi">{nav.map(([href,label,Icon])=><Link key={href} className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-4 font-bold text-ink hover:bg-white" href={href}><Icon className="size-5" />{label}</Link>)}</nav>{children}</div></div>;
}
