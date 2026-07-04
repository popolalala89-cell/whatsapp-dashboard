# AGENTS.md — Rules of Engagement

> Last updated: 2026-07-04

## Rule #1: Read semua file ai-context/ sebelum coding
Selalu baca CURRENT_STATE.md, TASK_BOARD.md, DECISIONS.md sebelum mengubah kode.

## Rule #2: PRD sebagai source of truth
Arsitektur, database schema, design system, dan API endpoints harus sesuai PRD.md. Tidak ada perubahan arsitektur tanpa persetujuan user.

## Rule #3: Jangan hapus kode existing tanpa verifikasi
Kalau mau refactor/hapus fungsi yang sudah ada, pastikan tidak dipakai di tempat lain.

## Rule #4: Log every error
Setiap error yang muncul harus dicatat di ERROR_HISTORY.md dengan format ERR-XXX.

## Rule #5: Design system WAJIB sesuai PRD
- Desktop ≥768px: macOS look (traffic lights, sidebar 320px, frosted glass, SF font)
- Mobile <768px: iOS look (large title, bottom tab bar, swipe actions)
- Warna: sistem Apple (#007AFF, #34C759, #FF3B30, dll)
- Jangan campur dengan Material Design

## Rule #6: Security first
- Semua input dari WhatsApp harus disanitasi (XSS prevention)
- Parameterized queries ke D1 (no string interpolation)
- JWT harus diverifikasi tiap request API
- CORS hanya allow dashboard.mydigitalid.my.id

## 🚪 COMPLETION GATE

> Task is NOT done until documentation is updated.
> AI agent MUST NOT declare task done before checklist complete.

### Checklist at end of each task:
- [ ] Code changed / committed
- [ ] CURRENT_STATE.md updated
- [ ] TASK_BOARD.md updated
- [ ] CHANGELOG.md updated
- [ ] DECISIONS.md updated (if new decisions)
- [ ] ERROR_HISTORY.md updated (if bug-related)
- [ ] LESSONS_LEARNED.md updated (if new lessons)
