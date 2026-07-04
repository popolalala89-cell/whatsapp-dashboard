-- WhatsApp Dashboard — Cloudflare D1 Schema
-- Run via: wrangler d1 execute whatsapp-dashboard --file=schema.sql

-- CHATS: satu baris per nomor WhatsApp customer
CREATE TABLE IF NOT EXISTS chats (
  id            TEXT PRIMARY KEY,
  wa_phone      TEXT NOT NULL UNIQUE,
  contact_name  TEXT DEFAULT '',
  last_message  TEXT DEFAULT '',
  last_msg_at   TEXT,
  unread        INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'active' CHECK(status IN ('active','archived','blocked')),
  label         TEXT DEFAULT '',
  assigned_to   TEXT DEFAULT '',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- MESSAGES: semua pesan dalam chat
CREATE TABLE IF NOT EXISTS messages (
  id            TEXT PRIMARY KEY,
  chat_id       TEXT NOT NULL,
  wa_message_id TEXT DEFAULT '',
  sender        TEXT NOT NULL CHECK(sender IN ('customer','admin')),
  content       TEXT DEFAULT '',
  msg_type      TEXT DEFAULT 'text' CHECK(msg_type IN ('text','image','template','document')),
  media_url     TEXT DEFAULT '',
  status        TEXT DEFAULT 'sent' CHECK(status IN ('sent','delivered','read','failed')),
  created_at    TEXT NOT NULL,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- TEMPLATES: template pesan cepat untuk admin
CREATE TABLE IF NOT EXISTS templates (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  content       TEXT NOT NULL,
  category      TEXT DEFAULT 'utility' CHECK(category IN ('marketing','utility','auth')),
  created_at    TEXT NOT NULL
);

-- ADMINS: user yang bisa login
CREATE TABLE IF NOT EXISTS admins (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT DEFAULT '',
  role          TEXT DEFAULT 'admin' CHECK(role IN ('admin','superadmin')),
  created_at    TEXT NOT NULL
);

-- SESSIONS: JWT session tracking (optional, for token revocation)
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,
  admin_id      TEXT NOT NULL,
  token_hash    TEXT NOT NULL,
  expires_at    TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chats_updated ON chats(updated_at);
CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status);
CREATE INDEX IF NOT EXISTS idx_sessions_admin ON sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
