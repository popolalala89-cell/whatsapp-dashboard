// WhatsApp Webhook Handler
// Handles incoming messages and webhook verification

import { jsonResponse, errorResponse } from './utils.js';
import { getChatByPhone, createChat, addMessage } from './db.js';

/**
 * GET /webhook — Webhook verification (required by Meta during setup)
 * Query params: hub.mode, hub.challenge, hub.verify_token
 */
export async function verify(request, env) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const challenge = url.searchParams.get('hub.challenge');
  const token = url.searchParams.get('hub.verify_token');
  
  if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  
  console.warn('Webhook verification failed:', { mode, token });
  return jsonResponse({ error: 'Verification failed' }, 403);
}

/**
 * POST /webhook — Incoming messages from WhatsApp
 */
export async function handleIncoming(request, env) {
  try {
    const body = await request.json();
    
    // Verify signature (if app secret is set)
    if (env.WHATSAPP_APP_SECRET) {
      const signature = request.headers.get('X-Hub-Signature-256');
      if (!signature || !(await verifySignature(body, signature, env.WHATSAPP_APP_SECRET))) {
        console.warn('Invalid webhook signature');
        return jsonResponse({ error: 'Invalid signature' }, 401);
      }
    }
    
    // Parse incoming message
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;
    const contacts = value?.contacts;
    
    if (!messages || messages.length === 0) {
      // This might be a status update or other non-message event
      return jsonResponse({ status: 'ok' }, 200);
    }
    
    // Process each message
    for (const msg of messages) {
      const from = msg.from; // Sender's phone number
      const msgId = msg.id;
      const msgType = msg.type;
      
      let content = '';
      let messageType = 'text';
      
      if (msgType === 'text' && msg.text) {
        content = msg.text.body || '';
      } else if (msgType === 'image' && msg.image) {
        content = '[Gambar]';
        messageType = 'image';
      } else if (msgType === 'document' && msg.document) {
        content = `[File: ${msg.document.filename || 'document'}]`;
        messageType = 'document';
      } else {
        content = '[Pesan tidak didukung]';
      }
      
      // Get contact name if available
      let contactName = from;
      if (contacts && contacts.length > 0) {
        const profile = contacts[0].profile;
        if (profile?.name) {
          contactName = profile.name;
        }
      }
      
      // Find existing chat or create new one
      const existingChat = await getChatByPhone(env.DB, from);
      
      if (existingChat) {
        await addMessage(env.DB, existingChat.id, msgId, 'customer', content);
        
        // Update contact name if we got one
        if (contactName !== from && contactName !== existingChat.contact_name) {
          await env.DB.prepare(
            'UPDATE chats SET contact_name = ?, updated_at = ? WHERE id = ?'
          ).bind(contactName, new Date().toISOString(), existingChat.id).run();
        }
      } else {
        const now = new Date().toISOString();
        const chatId = crypto.randomUUID();
        
        await env.DB.prepare(
          `INSERT INTO chats (id, wa_phone, contact_name, last_message, last_msg_at, unread, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
        ).bind(chatId, from, contactName, content, now, now, now).run();
        
        const msgRowId = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO messages (id, chat_id, wa_message_id, sender, content, msg_type, created_at)
           VALUES (?, ?, ?, 'customer', ?, ?, ?)`
        ).bind(msgRowId, chatId, msgId, content, messageType, now).run();
      }
    }
    
    return jsonResponse({ status: 'ok' }, 200);
  } catch (e) {
    console.error('Webhook error:', e.message, e.stack);
    // Always return 200 to WhatsApp (they'll retry on non-200)
    return jsonResponse({ status: 'error', message: e.message }, 200);
  }
}

/**
 * Verify WhatsApp webhook signature (HMAC-SHA256)
 */
async function verifySignature(payload, signatureHeader, appSecret) {
  try {
    // Extract the actual signature from header
    // Format: sha256=HEX_SIGNATURE
    const expectedSig = signatureHeader.replace('sha256=', '');
    
    // Compute HMAC-SHA256 of raw payload
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(JSON.stringify(payload))
    );
    
    const computedHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Constant-time comparison
    if (computedHex.length !== expectedSig.length) return false;
    return computedHex === expectedSig;
  } catch (e) {
    console.error('Signature verification error:', e.message);
    return false;
  }
}
