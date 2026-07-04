// DB Query Helpers for Cloudflare D1

// ========================
// CHATS
// ========================

export async function getChats(db, since) {
  if (since) {
    return db.prepare(
      'SELECT * FROM chats WHERE updated_at > ? AND status = ? ORDER BY updated_at DESC'
    ).bind(since, 'active').all();
  }
  return db.prepare(
    'SELECT * FROM chats WHERE status = ? ORDER BY updated_at DESC'
  ).bind('active').all();
}

export async function getChat(db, id) {
  return db.prepare('SELECT * FROM chats WHERE id = ?').bind(id).first();
}

export async function getChatByPhone(db, phone) {
  return db.prepare('SELECT * FROM chats WHERE wa_phone = ?').bind(phone).first();
}

export async function createChat(db, phone, content) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  
  await db.prepare(
    `INSERT INTO chats (id, wa_phone, contact_name, last_message, last_msg_at, unread, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
  ).bind(id, phone, phone, content, now, now, now).run();
  
  // Add first message
  const msgId = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO messages (id, chat_id, wa_message_id, sender, content, msg_type, created_at)
     VALUES (?, ?, '', 'customer', ?, 'text', ?)`
  ).bind(msgId, id, content, now).run();
  
  return { chatId: id, messageId: msgId };
}

export async function addMessage(db, chatId, waMessageId, sender, content) {
  const now = new Date().toISOString();
  const msgId = crypto.randomUUID();
  
  // Insert message
  await db.prepare(
    `INSERT INTO messages (id, chat_id, wa_message_id, sender, content, msg_type, created_at)
     VALUES (?, ?, ?, ?, ?, 'text', ?)`
  ).bind(msgId, chatId, waMessageId || '', sender, content, now).run();
  
  // Update chat's last message
  if (sender === 'customer') {
    await db.prepare(
      'UPDATE chats SET last_message = ?, last_msg_at = ?, unread = unread + 1, updated_at = ? WHERE id = ?'
    ).bind(content, now, now, chatId).run();
  } else {
    await db.prepare(
      'UPDATE chats SET last_message = ?, last_msg_at = ?, updated_at = ? WHERE id = ?'
    ).bind(content, now, now, chatId).run();
  }
  
  return msgId;
}

export async function updateChatRead(db, chatId) {
  const now = new Date().toISOString();
  return db.prepare(
    'UPDATE chats SET unread = 0, updated_at = ? WHERE id = ?'
  ).bind(now, chatId).run();
}

export async function updateChat(db, chatId, fields) {
  const now = new Date().toISOString();
  const sets = [];
  const values = [];
  
  if (fields.label !== undefined) { sets.push('label = ?'); values.push(fields.label); }
  if (fields.assigned_to !== undefined) { sets.push('assigned_to = ?'); values.push(fields.assigned_to); }
  if (fields.status !== undefined) { sets.push('status = ?'); values.push(fields.status); }
  if (fields.contact_name !== undefined) { sets.push('contact_name = ?'); values.push(fields.contact_name); }
  
  if (sets.length === 0) return { changed: false };
  
  sets.push('updated_at = ?');
  values.push(now);
  values.push(chatId);
  
  return db.prepare(
    `UPDATE chats SET ${sets.join(', ')} WHERE id = ?`
  ).bind(...values).run();
}

// ========================
// MESSAGES
// ========================

export async function getMessages(db, chatId, since) {
  if (since) {
    return db.prepare(
      'SELECT * FROM messages WHERE chat_id = ? AND created_at > ? ORDER BY created_at ASC'
    ).bind(chatId, since).all();
  }
  return db.prepare(
    'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
  ).bind(chatId).all();
}

// ========================
// TEMPLATES
// ========================

export async function getTemplates(db) {
  return db.prepare(
    'SELECT * FROM templates ORDER BY name ASC'
  ).all();
}

export async function getTemplate(db, id) {
  return db.prepare('SELECT * FROM templates WHERE id = ?').bind(id).first();
}

export async function createTemplate(db, name, content, category) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.prepare(
    'INSERT INTO templates (id, name, content, category, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, name, content, category || 'utility', now).run();
  return id;
}

export async function updateTemplate(db, id, fields) {
  const sets = [];
  const values = [];
  
  if (fields.name !== undefined) { sets.push('name = ?'); values.push(fields.name); }
  if (fields.content !== undefined) { sets.push('content = ?'); values.push(fields.content); }
  if (fields.category !== undefined) { sets.push('category = ?'); values.push(fields.category); }
  
  if (sets.length === 0) return { changed: false };
  
  values.push(id);
  return db.prepare(
    `UPDATE templates SET ${sets.join(', ')} WHERE id = ?`
  ).bind(...values).run();
}

export async function deleteTemplate(db, id) {
  return db.prepare('DELETE FROM templates WHERE id = ?').bind(id).run();
}

// ========================
// ADMINS
// ========================

export async function createAdmin(db, username, passwordHash, displayName) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.prepare(
    `INSERT INTO admins (id, username, password_hash, display_name, role, created_at)
     VALUES (?, ?, ?, ?, 'admin', ?)`
  ).bind(id, username, passwordHash, displayName || username, now).run();
  return id;
}

export async function getAdminByUsername(db, username) {
  return db.prepare('SELECT * FROM admins WHERE username = ?').bind(username).first();
}

export async function getAdminById(db, id) {
  return db.prepare('SELECT * FROM admins WHERE id = ?').bind(id).first();
}

// ========================
// SEARCH
// ========================

export async function searchChats(db, query) {
  const likeQuery = `%${query}%`;
  return db.prepare(
    `SELECT * FROM chats 
     WHERE contact_name LIKE ? OR last_message LIKE ? OR wa_phone LIKE ?
     ORDER BY updated_at DESC LIMIT 20`
  ).bind(likeQuery, likeQuery, likeQuery).all();
}

export async function searchMessages(db, query) {
  const likeQuery = `%${query}%`;
  return db.prepare(
    `SELECT m.*, c.contact_name, c.wa_phone 
     FROM messages m JOIN chats c ON m.chat_id = c.id
     WHERE m.content LIKE ?
     ORDER BY m.created_at DESC LIMIT 50`
  ).bind(likeQuery).all();
}

// ========================
// EXPORT
// ========================

export async function exportChatMessages(db, chatId) {
  const chat = await getChat(db, chatId);
  if (!chat) return null;
  
  const messages = await db.prepare(
    'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
  ).bind(chatId).all();
  
  return { chat, messages: messages.results || [] };
}
