// WhatsApp API Wrapper
// Sends messages via Meta Cloud API

import { jsonResponse, errorResponse } from './utils.js';

const WA_API_BASE = 'https://graph.facebook.com/v22.0';

/**
 * Send a text message via WhatsApp Cloud API
 */
export async function sendMessage(to, text, env) {
  const phoneId = env.WHATSAPP_PHONE_ID;
  const token = env.WHATSAPP_TOKEN;
  
  if (!phoneId || !token) {
    throw new Error('WHATSAPP_PHONE_ID and WHATSAPP_TOKEN must be configured');
  }
  
  const response = await fetch(`${WA_API_BASE}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { body: text },
    }),
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    console.error('WhatsApp API error:', JSON.stringify(result));
    throw new Error(`WhatsApp API error: ${result.error?.message || response.status}`);
  }
  
  return {
    waMessageId: result.messages?.[0]?.id || '',
    status: 'sent',
  };
}

/**
 * Send a template message via WhatsApp Cloud API
 */
export async function sendTemplate(to, templateName, params, env) {
  const phoneId = env.WHATSAPP_PHONE_ID;
  const token = env.WHATSAPP_TOKEN;
  
  if (!phoneId || !token) {
    throw new Error('WHATSAPP_PHONE_ID and WHATSAPP_TOKEN must be configured');
  }
  
  const components = [];
  if (params && params.length > 0) {
    components.push({
      type: 'body',
      parameters: params.map(p => ({ type: 'text', text: p })),
    });
  }
  
  const response = await fetch(`${WA_API_BASE}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'id' },
        components: components.length > 0 ? components : undefined,
      },
    }),
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    console.error('WhatsApp template error:', JSON.stringify(result));
    throw new Error(`WhatsApp API error: ${result.error?.message || response.status}`);
  }
  
  return {
    waMessageId: result.messages?.[0]?.id || '',
    status: 'sent',
  };
}

/**
 * Mark a message as read
 */
export async function markAsRead(messageId, env) {
  const phoneId = env.WHATSAPP_PHONE_ID;
  const token = env.WHATSAPP_TOKEN;
  
  if (!phoneId || !token) return;
  
  await fetch(`${WA_API_BASE}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  });
}
