"use client";

import { Download } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPwaButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installedOverride, setInstalledOverride] = useState(false);
  const [hint, setHint] = useState("");
  const standalone = useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia("(display-mode: standalone)");
      media.addEventListener("change", notify);
      window.addEventListener("appinstalled", notify);
      return () => {
        media.removeEventListener("change", notify);
        window.removeEventListener("appinstalled", notify);
      };
    },
    () => window.matchMedia("(display-mode: standalone)").matches,
    () => false,
  );
  const installed = standalone || installedOverride;

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalledOverride(true);
      setPrompt(null);
      setHint("");
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installed) return null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (!prompt) {
            setHint("Pilih ‘Tambahkan ke Layar Utama’ pada menu browser.");
            return;
          }
          void prompt.prompt().then(async () => {
            const choice = await prompt.userChoice;
            if (choice.outcome === "accepted") setInstalledOverride(true);
            setPrompt(null);
          });
        }}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-coral-200 bg-white px-3 text-xs font-extrabold text-coral-800"
      >
        <Download className="size-4" />
        Install
      </button>
      {hint ? (
        <p className="absolute right-0 top-12 z-40 w-56 rounded-xl border bg-white p-3 text-xs font-semibold text-ink shadow-lg">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
