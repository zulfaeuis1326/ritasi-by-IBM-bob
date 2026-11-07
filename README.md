# RitasiCounter Pengawas

Web app mobile-first untuk pengawas tambang mencatat ritasi hauler per unit, plus dashboard admin untuk monitoring dan pengelolaan data.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | Custom session (httpOnly cookie + bcrypt) |
| UI | Tailwind CSS + Recharts + Radix UI |
| Fonts | Bricolage Grotesque (heading) + Plus Jakarta Sans (body) |
| Deploy | Vercel-ready |

---

## Struktur Folder

```
ritasi-counter/
├── prisma/
│   ├── schema.prisma          # DB schema lengkap
│   └── seed.ts                # Data contoh (2 PIT, 6 fleet, 12 hauler, 4 user)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/     # POST: login → set httpOnly cookie
│   │   │   │   └── logout/    # POST: hapus session | GET: cek session
│   │   │   ├── ritasi/        # POST/GET ritasi (auth required)
│   │   │   │   └── [id]/      # PATCH/DELETE (auth + ownership check)
│   │   │   └── admin/
│   │   │       ├── pits/      # CRUD PIT (admin only)
│   │   │       ├── fleets/    # CRUD Fleet
│   │   │       ├── haulers/   # CRUD Hauler/Unit
│   │   │       ├── users/     # CRUD Pengawas + reset PIN
│   │   │       └── laporan/   # GET dengan filter lanjutan
│   │   ├── login/             # Halaman login
│   │   ├── pengawas/          # Layout pengawas (mobile-first)
│   │   │   ├── page.tsx       # Pilih PIT & shift
│   │   │   ├── [pitId]/[shift]/ # Input ritasi
│   │   │   └── riwayat/       # Riwayat 7 hari + edit/hapus
│   │   └── admin/             # Layout admin (sidebar desktop)
│   │       ├── page.tsx       # Dashboard (stats, grafik, ranking)
│   │       ├── laporan/       # Filter lanjutan + export CSV/Excel
│   │       ├── master/        # CRUD master data
│   │       ├── pengawas/      # Monitor pengawas aktif
│   │       └── audit/         # Audit log
│   ├── components/
│   │   ├── pengawas/          # PengawasShell, ShiftSelector, RitasiInputPage, RiwayatPage
│   │   └── admin/             # AdminShell, Dashboard, LaporanView, MasterDataView, AuditLog, PengawasMonitor
│   └── lib/
│       ├── prisma.ts          # Singleton PrismaClient
│       ├── auth.ts            # getSession, requireAuth, requireAdmin
│       ├── audit.ts           # createAuditLog helper
│       ├── validations.ts     # Zod schemas
│       └── utils.ts           # cn, formatDate, getMaterialColor, buildWhatsAppMessage, dll
└── src/middleware.ts          # Rate limiting + route protection
```

---

## Quick Start

### 1. Clone & Install

```bash
cd ritasi-counter
npm install
```

### 2. Database

```bash
# Salin env
cp .env.example .env
# Edit DATABASE_URL di .env

# Generate Prisma client
npm run db:generate

# Jalankan migrasi
npm run db:push   # atau: npm run db:migrate

# Seed data contoh
npm run db:seed
```

### 3. Jalankan Dev

```bash
npm run dev
# → http://localhost:3000
```

---

## Akun Bawaan (seed)

| Role | Username | Password/PIN | PIT |
|---|---|---|---|
| Admin | `admin` | `admin123` | – |
| Pengawas | `budi` | `1234` | PIT Alpha |
| Pengawas | `sari` | `2345` | PIT Alpha |
| Pengawas | `andi` | `3456` | PIT Bravo |

---

## Fitur

### Pengawas (mobile-first)
- **Login** → langsung masuk ke selector shift
- **Pilih Shift & PIT**: Pagi / Siang / Malam
- **Input Ritasi**: tap unit hauler → pilih material → +/– trip (autosave ke server)
- **Rekap shift**: total trip per unit, per fleet, per material
- **Kirim ke WhatsApp**: format rekap langsung lewat `wa.me`
- **Export CSV**: rekap shift saat ini
- **Riwayat 7 hari**: lihat, edit, hapus (dengan audit log)

### Admin (sidebar layout)
- **Dashboard**: stats hari ini, tren 30 hari, pie material, per-PIT bar, top-10 unit, tabel status pengawas
- **Laporan**: filter tanggal + PIT + fleet + shift + material + pengawas → export CSV / Excel (.xlsx)
- **Master Data**: CRUD PIT, Fleet, Unit/Hauler, Pengawas (tab-based UI)
- **Monitor Pengawas**: siapa input hari ini, berapa trip, kapan terakhir aktif
- **Audit Log**: semua aksi CREATE/UPDATE/DELETE/LOGIN/LOGOUT dengan diff before/after

---

## Keamanan

| Mekanisme | Detail |
|---|---|
| Auth | httpOnly cookie `session_token` (7 hari) + bcrypt hash |
| Rate Limiting | 10 req/60s di `/api/auth/login` · 60 req/60s di `/api/ritasi` per token |
| Role Guard | Middleware server + cek ulang di setiap API handler |
| PIT Isolation | Pengawas hanya bisa akses PIT yang ditugaskan (cek di server) |
| Audit Trail | Semua mutasi data tersimpan ke `audit_logs` |

---

## Deploy ke Vercel

1. Push ke GitHub / GitLab
2. Import project di [vercel.com](https://vercel.com)
3. Set environment variables:
   - `DATABASE_URL` → connection string PostgreSQL (Neon/Supabase/Railway)
   - `NEXTAUTH_SECRET` → string random 32+ karakter
   - `NEXTAUTH_URL` → URL production Anda
4. Build command: `npm run build` (default)
5. Setelah deploy pertama, jalankan seed via Vercel CLI atau psql langsung

---

## Skema Database

```
User ──────────┬── Ritasi (many)
               │
Pit ──────┬────┘
          │
          └── Fleet ──── Hauler ──── Ritasi (many)

AuditLog ──── User
Session  ──── User
```

**Tabel utama:**
- `users` — role ADMIN / PENGAWAS, pitId (scope)
- `pits` — lokasi tambang
- `fleets` — kelompok unit per PIT
- `haulers` — unit dump truck
- `ritasis` — catatan trip (unique: haulerId + material + date + shift)
- `audit_logs` — log perubahan
- `sessions` — session token

---

## Material & Warna

| Kode | Nama | Warna |
|---|---|---|
| OB | Over Burden | Amber `#F59E0B` |
| COAL | Batubara | Dark `#1F2937` |
| SOIL | Tanah | Brown `#92400E` |
| SOLU | Solution | Sky `#0EA5E9` |
| MUD | Lumpur | Lime `#65A30D` |

---

## Pengembangan Lanjutan (saran)

- Gunakan Redis untuk rate limiting di production (saat ini in-memory)
- Tambahkan push notification (FCM) untuk peringatan anomali ke admin
- PWA manifest + service worker untuk mode offline pengawas
- Multi-tenancy untuk beberapa site tambang

---

© 2024 RitasiCounter
