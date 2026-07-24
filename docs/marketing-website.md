# Public marketing website

## Routes

| Route | Tujuan |
|---|---|
| / | Landing page utama |
| /features | Ringkasan seluruh kemampuan produk |
| /industries | Hub solusi industri |
| /industries/cleaning-service | Solusi cleaning service |
| /industries/property-management | Solusi property management |
| /industries/contractor | Solusi contractor |
| /industries/maintenance | Solusi maintenance |
| /industries/field-sales | Solusi field sales |
| /industries/inspection-service | Solusi inspection service |
| /pricing | Paket Starter, Growth, dan Business |
| /demo | Product tour interaktif |
| /request-demo | Form permintaan demo |

## CTA destinations

- **Mulai Gratis**: /register
- **Lihat Demo**: /demo
- **Jadwalkan Demo**: /request-demo
- **Login**: /login

## Request demo delivery

Form request demo memvalidasi input di server, memiliki honeypot, dan membatasi lima permintaan per kombinasi IP/email setiap jam. Lead dikirim melalui adapter SMTP yang sama dengan email aplikasi.

Set DEMO_REQUEST_TO ke alamat email tim sales pada environment production. Jika tidak tersedia, penerima menggunakan nilai EMAIL_FROM. Kegagalan pengiriman tidak menampilkan detail internal kepada pengunjung dan dicatat melalui application logger.

## SEO

- Setiap halaman memiliki title, description, canonical URL, Open Graph, dan X card metadata.
- Social preview menggunakan aset brand khusus di public/og.png.
- /sitemap.xml memuat seluruh halaman marketing dan industri.
- /robots.txt mengizinkan halaman marketing serta mengecualikan application, authentication, dan API routes.
- Homepage menyertakan structured data SoftwareApplication.

Nilai APP_URL harus menggunakan origin production final agar canonical URL, sitemap, robots host, dan metadata URL benar.

## Accessibility and responsive behavior

- Struktur menggunakan landmark dan heading semantic.
- Navigasi desktop dan mobile dapat digunakan dengan keyboard.
- Interactive product tour menggunakan tab dengan state aria-selected.
- Form memiliki label, native validation, error role alert, dan tap target minimum.
- Coral CTA memakai shade gelap untuk menjaga kontras teks.
- Motion ringan dimatikan otomatis ketika perangkat menggunakan prefers-reduced-motion.
