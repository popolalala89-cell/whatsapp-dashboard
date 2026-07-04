// Auth Module — PBKDF2 password hashing + JWT tokens
// Uses Web Crypto API (no external dependencies)

import { jsonResponse, errorResponse } from './utils.js';
import { getAdminByUsername } from './db.js';

const ALGORITHM = 'SHA-256';
const ITERATIONS = 100000;
const KEY_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16;
const JWT_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

// ========================
// Password Hashing (PBKDF2)
// ========================

/**
 * Hash a password using PBKDF2 + SHA-256
 * Returns: salt:hash (hex encoded)
 */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: ALGORITHM,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a stored salt:hash string
 */
export async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
  const expectedHash = new Uint8Array(hashHex.match(/.{2}/g).map(b => parseInt(b, 16)));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: ALGORITHM,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  
  const actualHash = new Uint8Array(hash);
  
  if (actualHash.length !== expectedHash.length) return false;
  return actualHash.every((b, i) => b === expectedHash[i]);
}

// ========================
// JWT (HS256)
// ========================

function base64UrlEncode(data) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

function base64UrlEncodeStr(str) {
  const data = new TextEncoder().encode(str);
  return base64UrlEncode(data);
}

function base64UrlDecodeStr(str) {
  const data = base64UrlDecode(str);
  return new TextDecoder().decode(data);
}

async function signHmac(payload, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return base64UrlEncode(signature);
}

/**
 * Generate a JWT token (HS256)
 */
export async function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + JWT_EXPIRY,
  };
  
  const headerEncoded = base64UrlEncodeStr(JSON.stringify(header));
  const payloadEncoded = base64UrlEncodeStr(JSON.stringify(fullPayload));
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;
  const signature = await signHmac(signatureInput, secret);
  
  return `${signatureInput}.${signature}`;
}

/**
 * Verify and decode a JWT token
 * Returns payload object or null if invalid/expired
 */
export async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;
    
    // Verify signature
    const expectedSignature = await signHmac(signatureInput, secret);
    if (signatureEncoded !== expectedSignature) return null;
    
    // Decode payload
    const payload = JSON.parse(base64UrlDecodeStr(payloadEncoded));
    
    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    
    // Check issued at
    if (payload.iat && payload.iat > now) return null;
    
    return payload;
  } catch (e) {
    return null;
  }
}

// ========================
// Auth Middleware
// ========================

/**
 * Auth middleware — extracts and verifies JWT from Authorization header
 * Returns admin payload on success, or 401 Response on failure
 */
export async function authMiddleware(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  
  if (!payload) {
    return jsonResponse({ error: 'Invalid or expired token' }, 401);
  }
  
  return payload; // { sub: adminId, username: ..., role: ..., iat: ..., exp: ... }
}

// ========================
// Login Handler
// ========================

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
export async function login(request, env) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return jsonResponse({ error: 'Username and password required' }, 400);
    }
    
    const admin = await getAdminByUsername(env.DB, username);
    if (!admin) {
      return jsonResponse({ error: 'Invalid credentials' }, 401);
    }
    
    const valid = await verifyPassword(password, admin.password_hash);
    if (!valid) {
      return jsonResponse({ error: 'Invalid credentials' }, 401);
    }
    
    const token = await generateJWT(
      { sub: admin.id, username: admin.username, role: admin.role },
      env.JWT_SECRET
    );
    
    return jsonResponse({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        display_name: admin.display_name,
        role: admin.role,
      }
    });
  } catch (e) {
    return errorResponse('Invalid request body', 400);
  }
}
