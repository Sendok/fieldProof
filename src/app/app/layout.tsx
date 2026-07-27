import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, BriefcaseBusiness, Building2, CheckCircle2, ClipboardCheck, ClipboardList, History, LayoutDashboard, ListChecks, MapPin, ScrollText, Settings, UserRoundCog, Users } from "lucide-react";
import { auth } from "@/server/auth";
import { SyncIndicator } from "@/components/pwa/sync-indicator";
import { PrivateCacheScope } from "@/components/pwa/private-cache-scope";
import { InstallPwaButton } from "@/components/pwa/install-pwa-button";
import { OfflineAwareLogout } from "@/components/pwa/offline-aware-logout";
import { requireTenantContext } from "@/server/auth/tenant";
import { logoutAction } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  let tenant = null;
  try { tenant = await requireTenantContext(); } catch { /* onboarding has no active tenant yet */ }
  const isWorker = tenant?.role === "FIELD_WORKER";
  const adminNav = [["/app/dashboard", "Dashboard", LayoutDashboard], ["/app/my-tasks/today", "My tasks", ClipboardCheck], ["/app/work-orders", "Work orders", BriefcaseBusiness], ["/app/clients", "Clients", Building2], ["/app/sites", "Sites", MapPin], ["/app/templates", "Templates", ClipboardList], ["/app/teams", "Teams", Users], ["/app/members", "Anggota", UserRoundCog], ["/app/notifications", "Notifications", Bell], ["/app/audit-log", "Audit log", ScrollText], ["/app/settings/organization", "Pengaturan", Settings]] as const;
  const workerNav = [["/app/my-tasks/today", "Hari ini", ClipboardCheck], ["/app/my-tasks", "Tugas", ListChecks], ["/app/my-tasks/completed", "Riwayat", History]] as const;
  const nav = isWorker ? workerNav : adminNav;
  const homeHref = isWorker ? "/app/my-tasks/today" : "/app/dashboard";
  return <div className={`min-h-screen bg-cream-50 ${isWorker ? "worker-shell" : ""}`}><PrivateCacheScope userId={session.user.id!}/><header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-5"><Link href={homeHref} className="flex items-center gap-2 text-lg font-extrabold sm:text-xl"><span className="grid size-9 place-items-center rounded-xl bg-coral-600 text-white"><CheckCircle2 className="size-5" /></span>FieldProof</Link><div className="flex items-center gap-2">{isWorker ? <InstallPwaButton/> : null}<SyncIndicator/><span className="hidden text-sm font-semibold text-ink-soft lg:inline">{session.user.email}</span><OfflineAwareLogout action={logoutAction} compact label="Keluar dari FieldProof"/></div></div></header><div className={`mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-5 md:gap-6 md:py-6 ${isWorker ? "pb-28 md:grid-cols-[190px_1fr] md:pb-6" : "md:grid-cols-[220px_1fr]"}`}><nav className={`${isWorker ? "hidden md:flex" : "flex overflow-x-auto pb-2"} gap-2 md:flex-col md:overflow-visible`} aria-label="Navigasi aplikasi">{nav.map(([href,label,Icon])=><Link key={href} className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-4 font-bold text-ink hover:bg-white" href={href}><Icon className="size-5" />{label}</Link>)}</nav>{children}</div>{isWorker ? <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(37,34,30,.08)] backdrop-blur md:hidden" aria-label="Navigasi worker">{workerNav.map(([href,label,Icon])=><Link key={href} href={href} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-extrabold text-ink"><Icon className="size-5 text-coral-700"/>{label}</Link>)}</nav> : null}</div>;
}
