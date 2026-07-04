# Changelog

## [0.1.0] — 2026-07-04
### Added
- Worker backend: index.js (router), db.js (D1 queries), auth.js (PBKDF2 + JWT), webhook.js (WhatsApp handler), whatsapp.js (API wrapper), api.js (REST endpoints), utils.js
- Database schema: 5 tables + indexes (schema.sql)
- Wrangler config + worker package.json
- Frontend: index.html, tokens.css, base.css, macos.css, ios.css, api.js, auth.js, app.js, chat-list.js, chat-view.js, polling.js, template-picker.js
- CI/CD: GitHub Actions workflow (deploy.yml) — worker ke Cloudflare, frontend ke GitHub Pages
- .gitignore

## [0.0.0] — 2026-07-04
### Added
- PRD.md — product requirements document
- ai-context/ — AI context files (AGENTS.md, CURRENT_STATE.md, TASK_BOARD.md, DECISIONS.md, ERROR_HISTORY.md, LESSONS_LEARNED.md, PROJECT_MEMORY.md)
- Inisialisasi project WhatsApp Dashboard
