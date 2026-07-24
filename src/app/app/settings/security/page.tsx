import { desc, eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { getDatabase } from "@/server/db/client";
import { sessions } from "@/server/db/schema";
import { logoutAllAction, revokeSessionAction } from "../../actions";
import { OfflineAwareLogout } from "@/components/pwa/offline-aware-logout";

export default async function SecurityPage() {
  const current = await auth();
  const active = current?.user.id ? await getDatabase().select({ id: sessions.id, createdAt: sessions.createdAt, lastSeenAt: sessions.lastSeenAt, userAgent: sessions.userAgent, ipAddress: sessions.ipAddress }).from(sessions).where(eq(sessions.userId, current.user.id)).orderBy(desc(sessions.lastSeenAt)) : [];
  return <main><h1 className="text-3xl font-extrabold">Keamanan & session</h1><p className="mt-2 text-ink-soft">Tinjau perangkat yang masih memiliki akses ke akun Anda.</p><div className="mt-6 space-y-3">{active.map((item)=><article key={item.id} className="flex flex-col justify-between gap-4 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center"><div><p className="font-bold">{item.userAgent ?? "Perangkat tidak dikenal"}</p><p className="mt-1 text-sm text-ink-soft">Terakhir aktif {item.lastSeenAt.toLocaleString("id-ID")} · {item.ipAddress ?? "IP tidak tersedia"}</p></div><form action={revokeSessionAction}><input type="hidden" name="sessionId" value={item.id} /><button className="min-h-11 rounded-xl border px-4 font-bold text-danger">Cabut session</button></form></article>)}</div><div className="mt-6"><OfflineAwareLogout action={logoutAllAction}/></div></main>;
}
