// REST API Handlers
// All endpoints require JWT auth (handled by router middleware)

import { jsonResponse, errorResponse } from './utils.js';
import * as db from './db.js';
import * as whatsapp from './whatsapp.js';

// ========================
// CHATS
// ========================

/**
 * GET /api/chats?since=ISO — List all active chats
 */
export async function getChats(request, env, auth) {
  const url = new URL(request.url);
  const since = url.searchParams.get('since') || null;
  
  const result = await db.getChats(env.DB, since);
  return jsonResponse({ chats: result.results || [] });
}

/**
 * GET /api/chats/:id — Get single chat
 */
export async function getChat(request, env, auth) {
  const chatId = request.params.id;
  const chat = await db.getChat(env.DB, chatId);
  
  if (!chat) return jsonResponse({ error: 'Chat not found' }, 404);
  return jsonResponse({ chat });
}

/**
 * PUT /api/chats/:id — Update chat (label, assign, status, contact_name)
 */
export async function updateChat(request, env, auth) {
  const chatId = request.params.id;
  
  try {
    const body = await request.json();
    const result = await db.updateChat(env.DB, chatId, {
      label: body.label,
      assigned_to: body.assigned_to,
      status: body.status,
      contact_name: body.contact_name,
    });
    
    return jsonResponse({ updated: true });
  } catch (e) {
    return errorResponse('Invalid request body', 400);
  }
}

/**
 * PUT /api/chats/:id/read — Mark chat as read
 */
export async function markRead(request, env, auth) {
  const chatId = request.params.id;
  await db.updateChatRead(env.DB, chatId);
  return jsonResponse({ ok: true });
}

// ========================
// MESSAGES
// ========================

/**
 * GET /api/chats/:id/messages?since=ISO — Get messages for a chat
 */
export async function getMessages(request, env, auth) {
  const chatId = request.params.id;
  const url = new URL(request.url);
  const since = url.searchParams.get('since') || null;
  
  const result = await db.getMessages(env.DB, chatId, since);
  return jsonResponse({ messages: result.results || [] });
}

/**
 * POST /api/chats/:id/messages — Send a message to customer
 */
export async function sendMessage(request, env, auth) {
  const chatId = request.params.id;
  
  try {
    const body = await request.json();
    const content = body.content;
    const templateName = body.template_name;
    const templateParams = body.template_params;
    
    if (!content && !templateName) {
      return jsonResponse({ error: 'content or template_name required' }, 400);
    }
    
    // Get chat to find the phone number
    const chat = await db.getChat(env.DB, chatId);
    if (!chat) return jsonResponse({ error: 'Chat not found' }, 404);
    
    // Send via WhatsApp API
    let waResult;
    if (templateName) {
      waResult = await whatsapp.sendTemplate(chat.wa_phone, templateName, templateParams || [], env);
    } else {
      waResult = await whatsapp.sendMessage(chat.wa_phone, content, env);
    }
    
    // Save to database
    const msgId = await db.addMessage(env.DB, chatId, waResult.waMessageId, 'admin', content || `[Template: ${templateName}]`);
    
    return jsonResponse({
      message_id: msgId,
      wa_message_id: waResult.waMessageId,
      status: 'sent',
    });
  } catch (e) {
    console.error('Send message error:', e.message);
    return errorResponse(`Failed to send: ${e.message}`, 500);
  }
}

// ========================
// TEMPLATES
// ========================

export async function getTemplates(request, env, auth) {
  const result = await db.getTemplates(env.DB);
  return jsonResponse({ templates: result.results || [] });
}

export async function createTemplate(request, env, auth) {
  try {
    const body = await request.json();
    if (!body.name || !body.content) {
      return jsonResponse({ error: 'name and content required' }, 400);
    }
    
    const id = await db.createTemplate(env.DB, body.name, body.content, body.category);
    return jsonResponse({ id }, 201);
  } catch (e) {
    return errorResponse('Invalid request body', 400);
  }
}

export async function updateTemplate(request, env, auth) {
  const id = request.params.id;
  
  try {
    const body = await request.json();
    await db.updateTemplate(env.DB, id, {
      name: body.name,
      content: body.content,
      category: body.category,
    });
    return jsonResponse({ updated: true });
  } catch (e) {
    return errorResponse('Invalid request body', 400);
  }
}

export async function deleteTemplate(request, env, auth) {
  const id = request.params.id;
  await db.deleteTemplate(env.DB, id);
  return jsonResponse({ deleted: true });
}

// ========================
// SEARCH
// ========================

export async function search(request, env, auth) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  
  if (!query || query.length < 2) {
    return jsonResponse({ chats: [], messages: [] });
  }
  
  const [chats, messages] = await Promise.all([
    db.searchChats(env.DB, query),
    db.searchMessages(env.DB, query),
  ]);
  
  return jsonResponse({
    chats: chats.results || [],
    messages: messages.results || [],
  });
}

// ========================
// EXPORT
// ========================

export async function exportChat(request, env, auth) {
  const chatId = request.params.id;
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'json';
  
  const data = await db.exportChatMessages(env.DB, chatId);
  if (!data) return jsonResponse({ error: 'Chat not found' }, 404);
  
  if (format === 'csv') {
    // Generate CSV
    let csv = 'Tanggal,Pengirim,Pesan\n';
    for (const msg of data.messages.results || []) {
      const sender = msg.sender === 'customer' ? data.chat.contact_name || data.chat.wa_phone : 'Admin';
      const date = new Date(msg.created_at).toISOString();
      const content = `"${(msg.content || '').replace(/"/g, '""')}"`;
      csv += `${date},${sender},${content}\n`;
    }
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="chat-${chatId}.csv"`,
        ...(await corsHeaders()),
      },
    });
  }
  
  return jsonResponse(data);
}

// Helper for export
async function corsHeaders() {
  // Dynamic import to avoid circular
  const mod = await import('./utils.js');
  return mod.corsHeaders();
}
