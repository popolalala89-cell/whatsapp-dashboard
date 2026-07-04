# DECISIONS.md — Technical Decisions

> Format: DEC-XXX — YYYY-MM-DD — Title

---

**DEC-001 — 2026-07-04 — Ganti bcrypt dengan PBKDF2 di Workers**

**Konteks:** Workers tidak punya native bcrypt. bcryptjs menambah bundle size 50KB+.

**Keputusan:** Gunakan Web Crypto API `subtle.deriveKey()` dengan PBKDF2 + SHA-256.

**Konsekuensi:**
- ✅ Zero dependency
- ✅ Aman untuk use case single/multi admin
- ❌ Tidak kompatibel dengan bcrypt hash existing (tapi kita mulai dari kosong)

---

**DEC-002 — 2026-07-04 — Polling 5 detik, bukan WebSocket**

**Konteks:** GitHub Pages static = tidak bisa WebSocket. Cloudflare Durable Objects support WebSocket tapi butuh paid plan.

**Keputusan:** Gunakan polling via `setInterval(fetch, 5000)` dengan `?since=` timestamp.

**Konsekuensi:**
- ✅ Delay maksimal 5 detik — acceptable untuk admin chat
- ✅ Sederhana, zero infra tambahan
- ❌ 17k request/hari — masih aman di free tier (100k)
- ❌ Kalau nanti > 5 admin, perlu naikkan interval jadi 10-15s

---

**DEC-003 — 2026-07-04 — Vanilla JS + Vite, bukan React**

**Konteks:** App ini relatif sederhana — chat list + chat view + auth. React akan menambah bundle size dan kompleksitas.

**Keputusan:** Vanilla JavaScript modular dengan Vite sebagai bundler.

**Konsekuensi:**
- ✅ Bundle size minimal (< 100kb total)
- ✅ Zero framework lock-in
- ✅ Mudah di-maintain untuk scope ini
- ❌ Perlu state management manual (tapi cukup pakai event bus sederhana)

---

**DEC-004 — 2026-07-04 — Design Apple HIG (iOS + macOS)**

**Konteks:** User request tampilan seperti iOS di HP dan macOS di laptop.

**Keputusan:** Implementasi CSS Apple design language: SF font, systemBlue (#007AFF), frosted glass, traffic lights, iOS bottom tab bar.

**Konsekuensi:**
- ✅ User experience sesuai ekspektasi
- ✅ 2 layout dalam 1 codebase via CSS breakpoint
- ❌ Perlu custom CSS cukup banyak (tapi tidak ada framework lain yang cocok)
