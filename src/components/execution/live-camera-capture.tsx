"use client";

import { Camera, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function LiveCameraCapture({
  onCapture,
  disabled = false,
}: {
  onCapture: (blob: Blob, filename: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    const video = videoRef.current;
    void navigator.mediaDevices
      .getUserMedia({ audio: false, video: { facingMode: { ideal: facingMode } } })
      .then((nextStream) => {
        if (cancelled) {
          nextStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = nextStream;
        if (video) {
          video.srcObject = nextStream;
          void video.play().then(() => setReady(true));
        }
      })
      .catch(() => setError("Kamera tidak dapat dibuka. Periksa izin kamera FieldProof pada pengaturan browser."));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      if (video) video.srcObject = null;
    };
  }, [facingMode, open]);

  const capture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (facingMode === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(blob, `camera-${new Date().toISOString().replaceAll(":", "-")}.jpg`);
        setOpen(false);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
            setError("Live camera membutuhkan HTTPS atau localhost dan browser yang mendukung kamera.");
          } else {
            setError("");
          }
          setReady(false);
          setOpen(true);
        }}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-coral-600 px-3 font-bold text-white disabled:opacity-50"
      >
        <Camera className="size-5" />
        Buka kamera
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label="Kamera bukti pekerjaan">
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
            <div><p className="font-extrabold">Ambil bukti foto</p><p className="text-xs text-white/70">Pastikan objek terlihat jelas dan tidak buram.</p></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup kamera" className="grid size-11 place-items-center rounded-full bg-white/15"><X className="size-5"/></button>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden bg-neutral-900">
            <video ref={videoRef} autoPlay muted playsInline className={`h-full w-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`} />
            {!ready && !error ? <div className="absolute inset-0 grid place-items-center text-sm font-bold">Membuka kamera…</div> : null}
            {error ? <div className="absolute inset-0 grid place-items-center p-8 text-center"><p className="max-w-sm rounded-2xl bg-red-950/90 p-5 font-bold">{error}</p></div> : null}
          </div>
          <div className="flex items-center justify-center gap-8 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
            <button type="button" onClick={() => { setReady(false); setError(""); setFacingMode((current) => current === "environment" ? "user" : "environment"); }} aria-label="Ganti kamera" className="grid size-12 place-items-center rounded-full bg-white/15"><RotateCcw className="size-5"/></button>
            <button type="button" disabled={!ready} onClick={capture} aria-label="Ambil foto" className="grid size-20 place-items-center rounded-full border-4 border-white bg-coral-500 disabled:opacity-40"><Camera className="size-8"/></button>
            <span className="size-12" aria-hidden="true" />
          </div>
        </div>
      ) : null}
    </>
  );
}
