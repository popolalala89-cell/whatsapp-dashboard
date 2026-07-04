# TASK_BOARD.md — Task Tracker

> Last updated: 2026-07-04

## Fase 1 — MVP

| 1.1 | Setup 👨‍💻 Worker + D1 + wrangler | ✅ | wrangler.toml, package.json, schema.sql, GitHub Actions |
| 1.2 | Schema D1 | ✅ | 5 tables + indexes di schema.sql |
| 1.3 | Webhook handler | ✅ | src/webhook.js — verify + handleIncoming |
| 1.4 | Auth (PBKDF2 + JWT) | ✅ | src/auth.js — hash, verify, login, middleware |
| 1.5 | API CRUD chats & messages | ✅ | src/api.js + src/db.js — all endpoints |
| 1.6 | Frontend setup (Vite) | ✅ | index.html + package.json + build success |
| 1.7 | Login page + auth flow frontend | ✅ | js/auth.js + css/macos.css login card |
| 1.8 | Chat list component (iOS/Mac) | ✅ | js/chat-list.js + css/ios.css + css/macos.css |
| 1.9 | Chat view + send message | ✅ | js/chat-view.js + js/template-picker.js |
| 1.10 | Polling + real-time | ✅ | js/polling.js + js/app.js orchestrator |

## Fase 2 — Enhancement

| # | Task | Status | Catatan |
|---|---|---|---|
| 2.1 | Template manager (CRUD + quick reply) | ⬜ | — |
| 2.2 | Search chat & messages | ⬜ | — |
| 2.3 | Mark as read | ⬜ | — |
| 2.4 | Label/tag system | ⬜ | — |
| 2.5 | Multi-admin assign | ⬜ | — |
| 2.6 | Export chat CSV | ⬜ | — |

## Fase 3 — Polish

| # | Task | Status | Catatan |
|---|---|---|---|
| 3.1 | Media send (gambar) | ⬜ | — |
| 3.2 | Unread badge + browser notification | ⬜ | — |
| 3.3 | Keyboard shortcuts desktop | ⬜ | — |
| 3.4 | Swipe actions mobile | ⬜ | — |
| 3.5 | Dark mode | ⬜ | iOS/Mac native |
| 3.6 | Auto-reply rules | ⬜ | — |
