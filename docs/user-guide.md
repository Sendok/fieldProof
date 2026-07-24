# Panduan akses dan penggunaan FieldProof

Panduan ini menjelaskan fitur yang tersedia sampai Phase 5. Data contoh dan kredensial di bawah hanya untuk development; jangan digunakan pada production.

## Menjalankan aplikasi

### Seluruh layanan melalui Docker

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec app pnpm db:migrate
docker compose exec app pnpm db:seed
```

### Aplikasi lokal dengan infrastruktur Docker

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d postgres redis minio minio-init mailpit
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Jalankan background worker pada terminal lain:

```bash
pnpm worker:dev
```

## Alamat layanan development

| Layanan | Alamat | Kegunaan |
|---|---|---|
| Landing page | <http://localhost:3000/> | Halaman publik awal |
| Login | <http://localhost:3000/login> | Masuk ke aplikasi |
| Register | <http://localhost:3000/register> | Membuat akun baru |
| Dashboard | <http://localhost:3000/app/dashboard> | Workspace setelah login |
| Worker tasks | <http://localhost:3000/app/my-tasks/today> | Tugas lapangan hari ini |
| Mailpit | <http://localhost:8025> | Membaca email development |
| MinIO Console | <http://localhost:9001> | Memeriksa object storage development |
| Liveness | <http://localhost:3000/api/health> | Status proses web |
| Readiness | <http://localhost:3000/api/ready> | Status dependency aplikasi |

MinIO development menggunakan username `fieldproof` dan password `fieldproof-dev-secret`.

## Akun demo

Setelah `pnpm db:seed`, semua akun berikut menggunakan password `FieldProofDev123!`.

| Akun | Role | Penggunaan utama |
|---|---|---|
| `owner@fieldproof.local` | Owner | Administrasi penuh, audit, dan pengaturan organisasi |
| `admin@fieldproof.local` | Admin | Anggota, master data, template, dan work order |
| `supervisor@fieldproof.local` | Supervisor | Perencanaan pekerjaan, eksekusi tugas yang ditugaskan, dan review submission |
| `worker@fieldproof.local` | Field worker | Menjalankan work order yang ditugaskan |
| `client@fieldproof.local` | Client reviewer | Akses laporan sesuai scope klien ketika modul laporan tersedia |
| `auditor@fieldproof.local` | Auditor | Membaca laporan dan audit log |

Akun seed dinonaktifkan pada environment production. Akun `superadmin@fieldproof.local` adalah fixture platform dan tidak memiliki membership organisasi demo, sehingga bukan akun yang direkomendasikan untuk menguji alur organisasi.

## Hak akses role

| Fitur | Owner | Admin | Supervisor | Field worker | Client reviewer | Auditor |
|---|---:|---:|---:|---:|---:|---:|
| Pengaturan organisasi | Ya | Tidak | Tidak | Tidak | Tidak | Tidak |
| Anggota dan invitation | Ya | Ya | Tidak | Tidak | Tidak | Tidak |
| Clients, sites, dan templates | Ya | Ya | Tidak | Tidak | Tidak | Tidak |
| Membuat dan mengelola work order | Ya | Ya | Ya | Tidak | Tidak | Tidak |
| Menjalankan assigned work | Ya | Tidak | Ya | Ya | Tidak | Tidak |
| Review submission | Ya | Tidak | Ya | Tidak | Tidak | Tidak |
| Membaca laporan | Ya | Ya | Ya | Tidak | Ya | Ya |
| Audit log | Ya | Tidak | Tidak | Tidak | Tidak | Ya |

Otorisasi selalu diperiksa kembali di server. Menu aplikasi saat ini belum seluruhnya disembunyikan berdasarkan role; ketika pengguna membuka route tanpa izin, aplikasi akan menolak atau mengarahkannya kembali ke dashboard.

Hak `submission:review` dan `report:read` sudah didefinisikan untuk tenancy/RBAC, tetapi layar review supervisor, approval/revision, dan laporan klien belum tersedia sampai Phase 5. Alur operasional yang sudah aktif saat ini berhenti pada worker submission dan notification kepada supervisor.

## Registrasi, login, dan organisasi

### Membuat organisasi baru

1. Buka `/register`, isi nama, email kerja, dan password minimal 10 karakter.
2. Buka email verifikasi melalui provider email yang dikonfigurasi. Pada development, buka Mailpit di port `8025`.
3. Klik tautan verifikasi lalu login melalui `/login`.
4. Pengguna tanpa membership akan diarahkan ke `/app/onboarding` untuk membuat organisasi.
5. Pembuat organisasi menjadi `OWNER`.

### Mengundang anggota

1. Login sebagai Owner atau Admin.
2. Buka **Anggota** pada `/app/members`.
3. Masukkan email dan pilih role.
4. Ambil tautan undangan dari email penerima. Pada development, gunakan Mailpit.
5. Penerima login dengan email yang sama, atau membuat akun melalui tautan undangan, kemudian menerima undangan.

Undangan dapat dikirim ulang atau dibatalkan. Owner juga dapat mengubah role, suspend/reactivate anggota, dan mentransfer ownership.

### Session dan logout

Buka `/app/settings/security` untuk melihat dan mencabut session perangkat. **Logout semua perangkat** menghapus seluruh session akun. Jika perangkat masih memiliki draft atau evidence yang belum tersinkronisasi, aplikasi menampilkan peringatan sebelum logout.

## Alur administrator dan supervisor

Gunakan urutan berikut untuk menyiapkan pekerjaan:

1. **Clients** — buat data pelanggan di `/app/clients`.
2. **Sites** — buat lokasi kerja milik client di `/app/sites`.
3. **Anggota dan Teams** — undang worker/supervisor lalu kelompokkan anggota di `/app/teams`.
4. **Templates** — gunakan built-in template atau buat checklist di `/app/templates`.
5. Publikasikan template untuk menghasilkan versi immutable. Work order selalu merujuk versi template tertentu.
6. **Work orders** — buat pekerjaan di `/app/work-orders`, pilih client, site, template version, jadwal, supervisor, team, dan assignee.
7. Pantau pekerjaan melalui list, Calendar, atau Kanban. CSV export dan halaman printable tersedia dari modul work order.
8. Periksa notification center di `/app/notifications` untuk assignment dan perubahan workflow.

Work order hanya dapat diedit saat `DRAFT`, `SCHEDULED`, atau `ASSIGNED`. Pembatalan membutuhkan alasan. Status `COMPLETED` dan `CANCELLED` bersifat terminal.

## Alur field worker

1. Login menggunakan akun worker melalui `/login`.
2. Buka **My tasks** atau langsung ke `/app/my-tasks/today`.
3. Gunakan tab Today, Upcoming, dan Completed untuk menyaring tugas.
4. Buka salah satu tugas untuk melihat client, site, jadwal, instruksi, kontak, dan tautan Maps.
5. Tekan **Mulai pekerjaan**. Waktu mulai aktual dicatat dan status menjadi `IN_PROGRESS`.
6. Isi checklist. Progress field wajib ditampilkan pada bagian bawah layar.
7. Tambahkan evidence dari kamera atau galeri, pilih kategori, isi caption bila perlu, dan tambahkan GPS/signature jika template mensyaratkannya.
8. Tekan tombol ikon sinkronisasi di sticky action bar bila ingin memaksa sinkronisasi, atau lanjutkan bekerja karena jawaban juga disimpan pada perangkat.
9. Pastikan indikator sinkronisasi tidak memiliki upload tertunda.
10. Tekan **Review**, perbaiki validasi yang muncul, lalu submit.

Submission menyimpan snapshot template, jawaban, evidence, lokasi, versi aplikasi, serta waktu mulai/selesai. Snapshot revision bersifat append-only dan tidak menimpa revision sebelumnya.

## Penggunaan offline-lite

- Buka task saat masih online agar application shell dan halaman tersebut tersedia pada cache perangkat.
- Jawaban draft dan file evidence antrean disimpan di IndexedDB perangkat.
- Indikator header menunjukkan status online/offline dan jumlah item tertunda.
- Ketika koneksi kembali, buka task dan gunakan **Retry sync** jika antrean belum berjalan otomatis.
- Jangan menghapus data browser, menggunakan private browsing, atau logout sebelum seluruh antrean selesai.
- Konflik version, reassignment, cancellation, atau status terminal tidak menimpa data lokal secara diam-diam. Salinan lokal dipertahankan agar dapat dipulihkan.

Offline-lite bukan mode offline penuh: login pertama, task yang belum pernah dibuka, presigned upload, dan submission final tetap membutuhkan koneksi server.

## Evidence dan signature

- Format gambar: JPEG, PNG, atau WebP.
- Ukuran maksimum: 15 MB per file.
- Maksimum: 20 evidence aktif per work order.
- Evidence dapat dihapus sebelum submission, tetapi tidak setelah submission.
- Bucket storage bersifat private; download menggunakan signed URL setelah pemeriksaan tenant dan resource access.
- Field signature hanya menerima evidence signature dengan consent yang sesuai.

Pada production, browser membutuhkan HTTPS agar camera, GPS, dan service worker bekerja konsisten. `S3_PUBLIC_ENDPOINT` harus dapat dijangkau oleh browser pengguna dan CORS bucket harus mengizinkan origin aplikasi.

## Status landing page

Public marketing website tersedia pada route utama dengan halaman fitur, industri, pricing, demo produk, dan request demo. CTA **Mulai Gratis** menuju Register, **Lihat Demo** menuju Demo Produk, **Jadwalkan Demo** menuju Request Demo, dan **Login** menuju halaman Login.

Form request demo mengirim notifikasi ke environment variable DEMO_REQUEST_TO. Jika variabel tersebut tidak diisi, aplikasi menggunakan EMAIL_FROM sebagai penerima. Pada development, email dapat diperiksa melalui Mailpit.

Detail route dan SEO marketing tersedia pada [marketing website](marketing-website.md).

## Troubleshooting singkat

- Login seed gagal: jalankan migration dan seed, lalu pastikan PostgreSQL aktif.
- Email tidak terlihat: buka Mailpit dan pastikan `SMTP_HOST`/`SMTP_PORT` benar.
- Readiness `503`: periksa PostgreSQL dan Redis.
- Upload evidence gagal: periksa MinIO/S3, bucket `fieldproof`, `S3_PUBLIC_ENDPOINT`, dan CORS.
- Kamera/GPS tidak muncul: gunakan HTTPS pada production atau `localhost` pada development, lalu periksa permission browser.
- Draft tertahan: kembali online, buka task terkait, lalu tekan retry pada indikator sync.

Untuk detail teknis, lihat [permissions](permissions.md), [work-order state machine](work-order-state-machine.md), [offline synchronization](offline-sync.md), dan [file storage](file-storage.md).
