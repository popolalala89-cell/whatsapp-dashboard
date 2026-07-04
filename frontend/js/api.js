// API Base URL
const API_BASE = 'https://api.mydigitalid.my.id';

// Token storage key
const TOKEN_KEY = 'wa_dashboard_token';

/**
 * API wrapper for WhatsApp Dashboard backend.
 * Auto-adds Authorization header. Handles 401 → redirect to login.
 */
const API = {
  BASE: API_BASE,

  get token() {
    return localStorage.getItem(TOKEN_KEY);
  },

  set token(val) {
    if (val) {
      localStorage.setItem(TOKEN_KEY, val);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  /**
   * Core request method.
   * @param {string} path - API path (e.g. '/api/chats')
   * @param {object} options - fetch options
   * @returns {Promise<any>} parsed JSON response
   */
  async request(path, options = {}) {
    const url = `${this.BASE}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.token = null;
        // Dispatch event so app can react
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new APIError('Sesi telah berakhir. Silakan login kembali.', 401);
      }

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        if (!response.ok) {
          throw new APIError(`HTTP ${response.status}: ${response.statusText}`, response.status);
        }
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        const msg = data.message || data.error || `HTTP ${response.status}`;
        throw new APIError(msg, response.status, data);
      }

      return data;
    } catch (err) {
      if (err instanceof APIError) throw err;
      throw new APIError(err.message || 'Gagal terhubung ke server', 0);
    }
  },

  // === Auth ===

  /**
   * Login with username and password.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<object>} { token, user }
   */
  async login(username, password) {
    const data = await this.request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (data.token) {
      this.token = data.token;
    }

    return data;
  },

  // === Chats ===

  /**
   * Get all chats (or updated since timestamp).
   * @param {string} [since] - ISO timestamp
   * @returns {Promise<Array>} list of chats
   */
  async getChats(since) {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    const data = await this.request(`/api/chats${query}`);
    return data.chats || data || [];
  },

  /**
   * Search chats by query.
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async search(query) {
    const data = await this.request(`/api/chats/search?q=${encodeURIComponent(query)}`);
    return data.chats || data || [];
  },

  // === Messages ===

  /**
   * Get messages for a specific chat.
   * @param {string} chatId
   * @param {string} [since] - ISO timestamp
   * @returns {Promise<Array>}
   */
  async getMessages(chatId, since) {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    const data = await this.request(`/api/chats/${encodeURIComponent(chatId)}/messages${query}`);
    return data.messages || data || [];
  },

  /**
   * Send a message to a chat.
   * @param {string} chatId
   * @param {string} content - message text
   * @returns {Promise<object>} the sent message
   */
  async sendMessage(chatId, content) {
    const data = await this.request(`/api/chats/${encodeURIComponent(chatId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return data.message || data;
  },

  /**
   * Mark chat as read.
   * @param {string} chatId
   * @returns {Promise<object>}
   */
  async markRead(chatId) {
    return this.request(`/api/chats/${encodeURIComponent(chatId)}/read`, {
      method: 'POST',
    });
  },

  // === Templates ===

  /**
   * Get message templates.
   * @returns {Promise<Array>}
   */
  async getTemplates() {
    const data = await this.request('/api/templates');
    return data.templates || data || [];
  },

  /**
   * Create a new template.
   * @param {string} name
   * @param {string} content
   * @returns {Promise<object>}
   */
  async createTemplate(name, content) {
    return this.request('/api/templates', {
      method: 'POST',
      body: JSON.stringify({ name, content }),
    });
  },

  // === Contacts ===

  /**
   * Get contact info.
   * @param {string} contactId
   * @returns {Promise<object>}
   */
  async getContact(contactId) {
    return this.request(`/api/contacts/${encodeURIComponent(contactId)}`);
  },
};

/**
 * Custom API Error class.
 */
class APIError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

export { API, APIError, API_BASE, TOKEN_KEY };
