"use client";
import { countUnsynced } from "@/lib/offline-db";
import { useRef } from "react";
export function OfflineAwareLogout({action}:{action:()=>Promise<void>}){const confirmed=useRef(false);return <form action={action} onSubmit={(event)=>{if(confirmed.current)return;event.preventDefault();const form=event.currentTarget;void countUnsynced().then((pending)=>{if(pending&&!window.confirm(`Ada ${pending} item lokal yang belum sinkron. Logout tetap dilanjutkan?`))return;confirmed.current=true;navigator.serviceWorker?.controller?.postMessage({type:"CLEAR_PRIVATE_CACHES"});form.requestSubmit();});}}><button className="min-h-11 rounded-xl bg-danger px-5 font-bold text-white">Logout dari semua perangkat</button></form>}
