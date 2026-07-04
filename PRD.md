# PRD — WhatsApp Chat Management Dashboard

> **Versi:** 1.0  
> **Status:** Draft  
> **Author:** Hermes Agent  
> **Tanggal:** 4 Juli 2026

---

## 1. Visi & Latar Belakang

### 1.1 Problem Statement

Bisnis kecil menengah menggunakan WhatsApp Business API untuk komunikasi pelanggan, tetapi:
- WhatsApp Business API tidak punya dashboard yang nyaman untuk manajemen banyak chat
- BSP (Business Solution Provider) seperti WATI/Qontak mahal (Rp 300rb–1,2jt/bulan)
- Spreadsheet manual tidak scalable
- Butuh solusi yang bisa dipakai dari HP (iOS style) dan laptop (macOS style) dengan biaya minimal

### 1.2 Vision

Dashboard WhatsApp yang:
- **Gratis infrastruktur** — hanya bayar WA API per pesan
- **Responsive** — iOS look di HP, macOS look di laptop
- **Real-time enough** — polling 5 detik, pesan baru muncul otomatis
- **Self-hosted** — kode di GitHub Pages, backend di Cloudflare Workers, database di D1

### 1.3 Target User

- Admin bisnis (single atau multi admin)
- Melayani 50–200 chat/hari
- Butuh akses dari HP (dalam perjalanan) dan laptop (di meja kerja)

---

## 2. Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend | HTML/CSS/JS (Vanilla + Vite) | Ringan, zero dependency berat, deploy ke GitHub Pages |
| Backend | Cloudflare Workers | Serverless, 100k req/hari gratis, edge deployment |
| Database | Cloudflare D1 (SQLite di edge) | 5GB gratis, SQL familiar, zero maintenance |
| Auth | JWT manual + Cloudflare Access opsional | Firebase Auth terlalu berat untuk scope ini |
| WhatsApp | Meta Cloud API (v22.0) | Resmi, webhook support, RESTful |
| CI/CD | GitHub Actions (auto-deploy ke Pages) | Gratis, otomatis tiap push |
| Font | `-apple-system` / Inter CSS | Apple SF di iOS/Mac, Inter di lainnya |

### 2.1 Domain Architecture

```
Frontend:   dashboard.mydigitalid.my.id     → GitHub Pages
API:        api.mydigitalid.my.id            → Cloudflare Worker
Webhook:    api.mydigitalid.my.id/webhook     → Cloudflare Worker
```

---

## 3. UI/UX Design System

### 3.1 Design Philosophy

Dua tampilan, satu codebase — **responsive CSS breakpoint**.

| Breakpoint | Target Device | Design Language |
|---|---|---|
| < 768px | iPhone / HP Android | iOS Human Interface |
| ≥ 768px | iPad / MacBook / Desktop | macOS Aqua / Big Sur |

Perubahan hanya layout & styling — **data dan fitur SAMA** di kedua mode.

### 3.2 macOS Design (Desktop ≥ 768px)

```
┌─────────────────────────────────────────────────────────┐
│  — ☰  ✦     WhatsApp Dashboard          ● ● ●          │ ← Title bar macOS
├───────────────────┬─────────────────────────────────────┤
│                   │                                     │
│  🔍 Cari chat…   │  Budi Santoso                       │ ← Header nama
│                   │  Online                             │
│  ● Budi          │  ┌───────────────────────────┐       │
│    Halo kak,      │  │ Halo kak, resi pesanan   │       │ ← Bubble customer
│    resi DM-1024   │  │ DM-1024 apa ya?          │       │    (kiri, bg putih)
│       10:25       │  └───────────────────────────┘       │
│                   │                                     │
│  ● Sari          │  ┌───────────────────────────┐       │
│    Baik kak,      │  │ │ Siap kak, bentar dicek  │       │ ← Bubble admin
│    terima kasih   │  │ │ dulu ya                 │       │    (kanan, bg biru)
│       09:15       │  └───────────────────────────┘       │
│                   │                                     │
│  ● Adi           │                                     │
│    Siap…          │  ┌────────────────────────────────┐ │
│       Kemarin     │  │  Ketik pesan...      📎 📷 ▶  │ │ ← Input bar macOS
│                   │  └────────────────────────────────┘ │
│                   │                                     │
├───────────────────┴─────────────────────────────────────┤
│  3 chat aktif  •  2 belum dibaca                        │ ← Status bar minimal
└─────────────────────────────────────────────────────────┘
```

**Komponen macOS:**
- **Traffic lights** (merah/kuning/hijau) di pojok kiri title bar — CSS aja, tidak fungsional (hiasan)
- **Sidebar** — lebar 320px, background `systemGray6` (#f5f5f7), divider tipis
- **Bubble chat** — corner radius 10px, customer di kiri (bg putih, shadow ringan), admin di kanan (bg biru system `#007AFF`)
- **Input bar** — rounded 8px, frosted glass `backdrop-filter: blur(20px)`
- **Font** — `-apple-system` → SF Pro
- **Warna aksen** — `#007AFF` (Apple Blue), `#34C759` (Green untuk online), `#FF3B30` (Red untuk unread)

### 3.3 iOS Design (Mobile < 768px)

**Screen 1 — Chat List:**
```
┌──────────────────────┐
│  9:41                │
│                      │
│  Pesan               │ ← Large title (iOS style)
│                      │
│  🔍 Cari             │ ← Search bar rounded
│                      │
│  ● Budi             │
│    Halo kak, resi…   │
│    10:25             │
│                      │
│  ● Sari             │
│    Baik kak, terima… │
│    09:15             │
│                      │
│  ● Adi              │
│    Siap…             │
│    Kemarin           │
│                      │
│                      │
├──────────────────────┤
│  ○ Chat   ● ○        │ ← Bottom tab bar
│  Chat  Status  Settings│
└──────────────────────┘
```

**Screen 2 — Chat Detail:**
```
┌──────────────────────┐
│  9:41                │
│  ◀ Pesan      Budi  │ ← Navigation bar
│                      │
│                10:25 │ ← Timestamp
│  ┌──────────────┐    │
│  │ Halo kak,    │    │ ← Bubble customer (kiri)
│  │ resi DM-1024 │    │
│  │ apa ya?      │    │
│  └──────────────┘    │
│                      │
│         ┌──────────┐│
│         │ Siap kak, ││ ← Bubble admin (kanan)
│         │ bentar    ││
│         │ dicek dulu││
│         └──────────┘│
│                      │
│  [   Ketik pesan  ] ▶│ ← Input bar melebar
│                      │
└──────────────────────┘
```

**Komponen iOS:**
- **Status bar** — `9:41` dummy, background transparan
- **Navigation bar** — large title "Pesan", back button chevron di detail
- **Bottom tab** — 3 tab: Chat (active), Status, Settings — dengan SF Symbols style icon (CSS)
- **Search bar** — rounded 10px, bg `systemGray5`
- **Bubble chat** — sama persis dengan macOS, hanya ukuran menyesuaikan
- **Swipe actions** — swipe kiri di chat list: Archive / Delete (opsional fase 2)
- **Keyboard handling** — input bar naik saat keyboard muncul (viewport units)

### 3.4 Design Tokens (CSS Variables)

```css
:root {
  /* Warna Sistem Apple */
  --system-blue: #007AFF;
  --system-green: #34C759;
  --system-red: #FF3B30;
  --system-orange: #FF9500;
  --system-gray: #8E8E93;
  --system-gray2: #AEAEB2;
  --system-gray5: #E5E5EA;
  --system-gray6: #F2F2F7;
  
  /* Background */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F2F2F7;
  --bg-chat: #F2F2F7;
  
  /* Bubble */
  --bubble-customer-bg: #FFFFFF;
  --bubble-customer-text: #1C1C1E;
  --bubble-admin-bg: #007AFF;
  --bubble-admin-text: #FFFFFF;
  
  /* Spacing */
  --sidebar-width: 320px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
}
```

---

## 4. Arsitektur Teknis

### 4.1 Alur Data

```
WhatsApp Cloud API (Meta)
    │
    ├── [IN] Pesan dari customer → POST Webhook ke Worker
    │       api.mydigitalid.my.id/webhook
    │       ↓
    │    Worker: verifikasi signature → simpan ke D1 → return 200
    │
    ├── [OUT] Admin kirim pesan dari dashboard
    │       Frontend → POST /api/send → Worker → POST WhatsApp API
    │       ↓
    │    Worker: terima dari frontend → simpan ke D1 → kirim ke WA → return response
    │
    └── [POLL] Frontend cek pesan baru
        Frontend → GET /api/chats?since=TIMESTAMP → Worker → D1 query
        Setiap 5 detik
```

### 4.2 Komponen

```
whatsapp-dashboard/
├── frontend/                       # GitHub Pages
│   ├── index.html
│   ├── css/
│   │   ├── tokens.css              # Design tokens (Apple colors)
│   │   ├── macos.css               # macOS layout & components
│   │   ├── ios.css                 # iOS layout & components
│   │   └── base.css               # Base styles (fonts, reset)
│   ├── js/
│   │   ├── app.js                  # App initialization & router
│   │   ├── api.js                  # fetch wrapper ke Worker
│   │   ├── auth.js                 # Login/logout/token
│   │   ├── chat-list.js            # Sidebar / chat list component
│   │   ├── chat-view.js            # Chat panel component
│   │   ├── message-bubble.js       # Bubble renderer
│   │   ├── template-picker.js      # Template quick reply
│   │   └── polling.js              # Polling logic (5s interval)
│   └── assets/
│       └── icons/                  # SVG icons (SF Symbols style)
│
├── worker/                         # Cloudflare Workers
│   ├── src/
│   │   ├── index.js                # Router (itty-router)
│   │   ├── webhook.js              # Webhook handler (doGet + doPost)
│   │   ├── api.js                  # REST API handlers
│   │   ├── whatsapp.js             # WhatsApp API wrapper (send message)
│   │   ├── auth.js                 # JWT auth middleware
│   │   ├── db.js                   # D1 query helpers
│   │   └── utils.js               # Helpers (signature verify, formatter)
│   ├── schema.sql                  # D1 database schema
│   ├── wrangler.toml              # Worker config
│   └── package.json
│
├── ai-context/                     # AI context files (lihat Fase 2)
│
└── PRD.md                          # File ini
```

---

## 5. Database Schema (Cloudflare D1)

```sql
-- =====================================================
-- WHATSAPP DASHBOARD — CLOUDFLARE D1 SCHEMA
-- =====================================================

-- CHATS: satu baris per nomor WhatsApp customer
CREATE TABLE IF NOT EXISTS chats (
  id            TEXT PRIMARY KEY,              -- UUID
  wa_phone      TEXT NOT NULL UNIQUE,          -- Nomor WA customer (62xxx)
  contact_name  TEXT DEFAULT '',               -- Nama (auto atau diisi manual)
  last_message  TEXT DEFAULT '',               -- Preview pesan terakhir
  last_msg_at   TEXT,                          -- ISO 8601 timestamp
  unread        INTEGER DEFAULT 0,             -- Jumlah belum dibaca
  status        TEXT DEFAULT 'active',         -- active | archived | blocked
  label         TEXT DEFAULT '',               -- Tag custom (contoh: "VIP", "Reseller")
  assigned_to   TEXT DEFAULT '',               -- Admin username yang megang
  created_at    TEXT NOT NULL,                 -- ISO 8601
  updated_at    TEXT NOT NULL                  -- ISO 8601
);

-- MESSAGES: semua pesan dalam chat
CREATE TABLE IF NOT EXISTS messages (
  id            TEXT PRIMARY KEY,              -- UUID
  chat_id       TEXT NOT NULL,                 -- FK → chats.id
  wa_message_id TEXT DEFAULT '',               -- ID dari WhatsApp API (untuk tracking)
  sender        TEXT NOT NULL,                 -- 'customer' | 'admin'
  content       TEXT DEFAULT '',               -- Isi pesan
  msg_type      TEXT DEFAULT 'text',           -- text | image | template | document
  media_url     TEXT DEFAULT '',               -- URL file/gambar (jika ada)
  status        TEXT DEFAULT 'sent',           -- sent | delivered | read | failed
  created_at    TEXT NOT NULL,                 -- ISO 8601
  FOREIGN KEY (chat_id) REFERENCES chats(id)
);

-- TEMPLATES: template pesan cepat
CREATE TABLE IF NOT EXISTS templates (
  id            TEXT PRIMARY KEY,              -- UUID
  name          TEXT NOT NULL,                 -- Nama template (contoh: "Info Resi")
  content       TEXT NOT NULL,                 -- Isi template
  category      TEXT DEFAULT 'utility',        -- marketing | utility | auth
  created_at    TEXT NOT NULL
);

-- ADMINS: user yang bisa login ke dashboard
CREATE TABLE IF NOT EXISTS admins (
  id            TEXT PRIMARY KEY,              -- UUID
  username      TEXT NOT NULL UNIQUE,          -- Login username
  password_hash TEXT NOT NULL,                 -- bcrypt hash
  display_name  TEXT DEFAULT '',               -- Nama tampilan
  role          TEXT DEFAULT 'admin',          -- admin | superadmin
  created_at    TEXT NOT NULL
);

-- SESSIONS: JWT session tracking (opsional, untuk revoke)
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,              -- UUID
  admin_id      TEXT NOT NULL,                 -- FK → admins.id
  token_hash    TEXT NOT NULL,                 -- Hash dari JWT
  expires_at    TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chats_updated ON chats(updated_at);
CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status);
```

---

## 6. API Endpoints

Base URL: `https://api.mydigitalid.my.id`

### 6.1 WhatsApp Webhook

| Method | Path | Deskripsi | Auth |
|---|---|---|---|
| GET | `/webhook` | Verifikasi challenge dari Meta (hub.challenge) | Meta token |
| POST | `/webhook` | Terima pesan masuk dari customer | Meta signature |

### 6.2 Auth

| Method | Path | Deskripsi | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Login admin → return JWT | Public |
| POST | `/api/auth/verify` | Verify token masih valid | Bearer |

### 6.3 Chats

| Method | Path | Deskripsi | Auth |
|---|---|---|---|
| GET | `/api/chats` | Daftar semua chat (inbox) | Bearer |
| GET | `/api/chats?since=ISO` | Chat yang berubah sejak timestamp | Bearer |
| PUT | `/api/chats/:id` | Update label, assign, archive | Bearer |
| DELETE | `/api/chats/:id` | Archive chat | Bearer |

### 6.4 Messages

| Method | Path | Deskripsi | Auth |
|---|---|---|---|
| GET | `/api/chats/:id/messages` | Pesan dalam chat (pagination) | Bearer |
| GET | `/api/chats/:id/messages?since=ISO` | Pesan baru sejak timestamp | Bearer |
| POST | `/api/chats/:id/messages` | Kirim pesan ke customer | Bearer |
| PUT | `/api/chats/:id/read` | Mark all as read | Bearer |

### 6.5 Templates

| Method | Path | Deskripsi | Auth |
|---|---|---|---|
| GET | `/api/templates` | Daftar template | Bearer |
| POST | `/api/templates` | Tambah template baru | Bearer |
| PUT | `/api/templates/:id` | Edit template | Bearer |
| DELETE | `/api/templates/:id` | Hapus template | Bearer |

### 6.6 Search & Export

| Method | Path | Deskripsi | Auth |
|---|---|---|---|
| GET | `/api/search?q=...` | Cari chat/pesan (LIKE query) | Bearer |
| GET | `/api/export/chats/:id?format=csv` | Export chat ke CSV | Bearer |

### 6.7 WhatsApp API Wrapper (internal Worker)

Fungsi di `whatsapp.js`, bukan endpoint publik:

```javascript
// Kirim pesan teks
async function sendMessage(to, text) → { waMessageId, status }

// Kirim template
async function sendTemplate(to, templateName, params) → { waMessageId, status }

// Mark as read
async function markAsRead(waMessageId) → { success }

// Get media URL
async function getMediaUrl(mediaId) → { url }
```

---

## 7. Business Logic

### 7.1 Webhook Handling

1. Meta kirim POST ke `/webhook` dengan body JSON
2. Worker verifikasi signature (X-Hub-Signature-256)
3. Parse `entry[0].changes[0].value.messages[0]`
4. Extract: `from` (nomor), `id` (message ID), `text.body` (isi)
5. Cek apakah `from` sudah ada di tabel `chats`:
   - **Baru:** INSERT chat baru + INSERT message
   - **Existing:** UPDATE `last_message`, `unread+1`, INSERT message
6. Return 200 OK

### 7.2 Kirim Pesan (Admin)

1. Frontend POST `/api/chats/:id/messages` dengan `{ content: "..." }`
2. Worker: INSERT message dengan `sender: 'admin'`
3. Worker: POST ke WhatsApp API `/{phone-number-id}/messages`
4. Update `wa_message_id` di row message
5. Update `last_message` dan `last_msg_at` di chats
6. Return response ke frontend

### 7.3 Polling

Frontend setiap 5 detik:
```
GET /api/chats?since=2026-07-04T10:00:00Z
→ Return chat yang updated_at > since
→ Update list di sidebar
→ Update unread badge

GET /api/chats/:activeId/messages?since=2026-07-04T10:00:00Z
→ Return pesan baru untuk chat yang sedang aktif
→ Append ke chat view
```

### 7.4 Auth Flow

1. Admin login: POST `/api/auth/login` dengan username + password
2. Worker verifikasi bcrypt hash di tabel `admins`
3. Worker generate JWT (exp 24 jam) → return ke frontend
4. Frontend simpan di localStorage
5. Setiap request: header `Authorization: Bearer <token>`
6. Worker middleware verifikasi JWT tiap request
7. Kalau expired → redirect ke login page

### 7.5 Auto-reply (Fase 2 - optional)

- Admin bisa set auto-reply message per label atau untuk semua chat baru
- Tersimpan di tabel config/key-value (bisa pakai D1 atau KV)
- Dipicu pas webhook masuk dan chat baru

---

## 8. Milestone & Prioritas

### Fase 1 — MVP (Minggu 1)
**Tujuan:** Bisa terima & kirim pesan, login, inbox

| # | Task | Estimasi |
|---|---|---|
| 1.1 | Setup Cloudflare Worker + D1 + wrangler | 1 hari |
| 1.2 | Schema D1 (tables + indexes) | 0.5 hari |
| 1.3 | Webhook handler (verify + save to D1) | 1 hari |
| 1.4 | Auth (login + JWT middleware) | 0.5 hari |
| 1.5 | API CRUD chats & messages | 1 hari |
| 1.6 | Frontend setup (Vite + GitHub Pages) | 0.5 hari |
| 1.7 | Login page + auth flow frontend | 0.5 hari |
| 1.8 | Chat list component (sidebar iOS/Mac) | 1 hari |
| 1.9 | Chat view + send message | 1 hari |
| 1.10 | Polling logic + real-time update | 0.5 hari |

### Fase 2 — Enhancement (Minggu 2)

| # | Task |
|---|---|
| 2.1 | Template manager (CRUD + quick reply) |
| 2.2 | Search chat & messages |
| 2.3 | Mark as read |
| 2.4 | Label/tag system |
| 2.5 | Multi-admin (assign chat) |
| 2.6 | Export chat CSV |

### Fase 3 — Polish (Minggu 3+)

| # | Task |
|---|---|
| 3.1 | Media send (gambar) |
| 3.2 | Unread badge + browser notification |
| 3.3 | Keyboard shortcuts desktop |
| 3.4 | Swipe actions mobile |
| 3.5 | Dark mode (iOS/Mac native) |
| 3.6 | Auto-reply rules |

---

## 9. Security Considerations

| Aspek | Approach |
|---|---|
| **Webhook signature** | Verifikasi X-Hub-Signature-256 dengan App Secret Meta |
| **API auth** | JWT (HS256) dengan secret dari Cloudflare Secrets |
| **Password** | bcrypt hash, bukan plaintext |
| **Rate limiting** | Cloudflare WAF + rate limiting (100 req/min per IP) |
| **CORS** | Allow hanya dari `dashboard.mydigitalid.my.id` |
| **XSS** | Sanitasi semua input dari WhatsApp (content bisa apa aja) |
| **D1 injection** | Parameterized queries (binding), bukan string interpolation |
| **HTTPS** | Otomatis dari Cloudflare |

---

## 10. Konstanta (Yang Tidak Berubah Sepanjang Project)

- **Backend WA API**: tetap Meta Cloud API, endpoint `graph.facebook.com/v22.0`
- **Database engine**: tetap D1 (SQLite), tidak migrasi ke PostgreSQL/RDS
- **Frontend host**: tetap GitHub Pages (static hosting)
- **Domain**: `dashboard.mydigitalid.my.id` dan `api.mydigitalid.my.id`
- **Design system**: tetap Apple HIG (iOS/Mac), tidak berubah ke Material/Android
- **Hanya admin dashboard**: ini bukan replacement WhatsApp untuk customer, hanya tools admin

---

## 11. Referensi

- [Meta WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
