import { ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";

type Location = { latitude: number; longitude: number; accuracy?: number };

export function OpenStreetMapPreview({ location, label, address }: { location: Location | null; label: string; address?: string }) {
  const searchHref = `https://www.openstreetmap.org/search?query=${encodeURIComponent(address || `${location?.latitude},${location?.longitude}`)}`;
  if (!location) {
    return <div className="rounded-2xl border bg-cream-50 p-4"><p className="font-extrabold">Lokasi pekerjaan</p><p className="mt-1 text-sm text-ink-soft">Koordinat belum tersedia. Aktifkan GPS untuk merekam titik laporan.</p><Link target="_blank" href={searchHref} className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold text-coral-800"><MapPin className="size-5"/>Cari alamat di OpenStreetMap<ExternalLink className="size-4"/></Link></div>;
  }
  const delta = 0.0035;
  const bbox = [location.longitude - delta, location.latitude - delta, location.longitude + delta, location.latitude + delta].join(",");
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${location.latitude},${location.longitude}`)}`;
  const markerHref = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`;
  return <figure className="overflow-hidden rounded-2xl border bg-white"><iframe title={`Peta ${label}`} src={embed} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className="h-52 w-full border-0 sm:h-64"/><figcaption className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><div><p className="font-extrabold">{label}</p><p className="mt-1 text-xs text-ink-soft">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}{location.accuracy ? ` · akurasi ±${Math.round(location.accuracy)} m` : ""}</p></div><Link target="_blank" href={markerHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-bold text-coral-800">Buka peta<ExternalLink className="size-4"/></Link></figcaption></figure>;
}
