// WhatsApp Dashboard — Cloudflare Worker Entry Point
// Router using itty-router (bundled, not npm)

import { Router } from 'itty-router';
import * as webhook from './webhook.js';
import * as auth from './auth.js';
import * as api from './api.js';
import { jsonResponse, corsHeaders, errorResponse } from './utils.js';
import * as db from './db.js';

// Create router
const router = Router();

// ========================
// CORS Preflight (OPTIONS)
// ========================
router.options('*', (request) => {
  const headers = corsHeaders();
  return new Response(null, { status: 204, headers });
});

// ========================
// WhatsApp Webhook
// ========================
// GET /webhook — Verification challenge (Meta setup)
router.get('/webhook', async (request, env) => {
  return webhook.verify(request, env);
});

// POST /webhook — Incoming messages from customers
router.post('/webhook', async (request, env) => {
  return webhook.handleIncoming(request, env);
});

// ========================
// Auth (public)
// ========================
router.post('/api/auth/login', async (request, env) => {
  // Debug: check if env has JWT_SECRET
  const hasJwt = typeof env.JWT_SECRET !== 'undefined';
  const jwtLen = env.JWT_SECRET ? env.JWT_SECRET.length : 0;
  return jsonResponse({
    env_has_jwt: hasJwt,
    jwt_length: jwtLen,
    env_keys: Object.keys(env),
  });
});

// ========================
// Setup — Create first admin (one-time)
// ========================
router.post('/api/setup', async (request, env) => {
  try {
    // Check if any admin already exists
    const existing = await env.DB.prepare('SELECT COUNT(*) as count FROM admins').first();
    if (existing.count > 0) {
      return jsonResponse({ error: 'Setup already completed' }, 400);
    }

    const body = await request.json();
    const { username, password, display_name } = body;

    if (!username || !password || password.length < 6) {
      return jsonResponse({ error: 'username and password (min 6 chars) required' }, 400);
    }

    const passwordHash = await auth.hashPassword(password);
    const id = await db.createAdmin(env.DB, username, passwordHash, display_name || username);

    return jsonResponse({ ok: true, message: 'Admin created', admin: { id, username } }, 201);
  } catch (e) {
    console.error('Setup error:', e.message);
    return errorResponse('Setup failed: ' + e.message, 500);
  }
});

// ========================
// API (JWT protected)
// ========================

// Chats
router.get('/api/chats', async (request, env) => {
  const authResult = await auth.authMiddleware(request, env);
  if (authResult instanceof Response) return authResult;
  return api.getChats(request, env, authResult);
});

router.get('/api/chats/:id', async (request, env) => {
  const authResult = await auth.authMiddleware(request, env);
  if (authResult instanceof Response) return authResult;
  return api.getChat(request, env, authResult);
});

router.put('/api/chats/:id', async (request, env) => {
  const authResult = await auth.authMiddleware(request, env);
  if (authResult instanceof Response) return authResult;
  return api.updateChat(request, env, authResult);
});

router.put('/api/chats/:id/read', async (request, env) => {
  const authResult = await auth.authMiddleware(request, env);
  if (authResult instanceof Response) return authResult;
  return api.markRead(request, env, authResult);
});

// Messages
router.get('/api/chats/:id/messages', async (request, env) => {
  const authResult = await auth.authMiddleware(request, env);
  if (authResult instanceof Response) return authResult;
  return api.getMessages(request, env, authResult);
});

router.post('/api/chats/:id/messages', async (request, env) => {
  const authResult = await auth.authMiddleware(request, env);
  if (authResult instanceof Response) return authResult;
  return api.sendMessage(request, env, authResult);
});

// Templates
router.get('/api/templates', async (request, env) => {
  const authResult = await auth.authMiddleware(request, env);
  if (authResult instanceof Response) return authResult;
  return api.getTemplates(request, env, authResult);
});

router.post('/api/templates', async (request, env) => {
  const authResult = await auth.authMiddleware(request, env);
  if (authResult instanceof Response) return authResult;
  return api.createTemplate(request, env, authResult);
});

router.put('/api/templates/:id', async (request, env) => {
  const authResult = await auth.authMiddleware(request, env);
  if (authResult instanceof Response) return authResult;
  return api.updateTemplate(request, env, authResult);
});

router.delete('/api/templates/:id', async (request, env) => {
  const authResult = await auth.authMiddleware(request, env);
  if (authResult instanceof Response) return authResult;
  return api.deleteTemplate(request, env, authResult);
});

// Search
router.get('/api/search', async (request, env) => {
  const authResult = await auth.authMiddleware(request, env);
  if (authResult instanceof Response) return authResult;
  return api.search(request, env, authResult);
});

// Export
router.get('/api/export/chats/:id', async (request, env) => {
  const authResult = await auth.authMiddleware(request, env);
  if (authResult instanceof Response) return authResult;
  return api.exportChat(request, env, authResult);
});

// ========================
// 404 Fallback
// ========================
router.all('*', () => {
  return jsonResponse({ error: 'Not found' }, 404);
});

// ========================
// Worker Entry Point
// ========================
export default {
  async fetch(request, env, ctx) {
    try {
      return await router.fetch(request, env, ctx);
    } catch (err) {
      console.error('Unhandled error:', err.message, err.stack);
      return errorResponse('Internal error', 500);
    }
  }
};
