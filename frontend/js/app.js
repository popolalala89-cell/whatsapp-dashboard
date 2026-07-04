import { API } from './api.js';
import { Auth } from './auth.js';
import { Polling } from './polling.js';
import { ChatList } from './chat-list.js';
import { ChatView } from './chat-view.js';

/**
 * Main App Controller — routes, state, rendering.
 */
const App = {
  // Application state
  state: {
    chats: [],
    activeChatId: null,
    messages: {},     // chatId -> [messages]
    user: null,
    view: 'login',    // 'login' | 'chat-list' | 'chat-detail'
    isMobile: window.innerWidth < 768,
  },

  /**
   * Initialize the app.
   */
  async init() {
    // Auth setup
    Auth.setup();

    // Listen for resize (mobile/desktop switch)
    window.addEventListener('resize', () => {
      const wasMobile = this.state.isMobile;
      this.state.isMobile = window.innerWidth < 768;
      if (wasMobile !== this.state.isMobile) {
        this.render();
      }
    });

    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute());

    // Polling callbacks
    Polling.onChatsUpdate = (newChats) => {
      this._mergeChats(newChats);
      this.renderChatList();
    };

    Polling.onMessagesUpdate = (chatId, newMessages) => {
      this._mergeMessages(chatId, newMessages);
      if (this.state.activeChatId === chatId) {
        this.renderMessages();
      }
    };

    Polling.onError = (err) => {
      console.error('Polling error:', err);
    };

    // Handle route
    this.handleRoute();
  },

  /**
   * Handle hash-based routing.
   * #login — show login screen
   * #chat-list — show chat list (auth required)
   * #chat/<id> — show chat detail (auth required)
   * default — redirect based on auth
   */
  handleRoute() {
    const hash = window.location.hash || '#';

    if (hash.startsWith('#login')) {
      if (Auth.check()) {
        window.location.hash = '#chat-list';
        return;
      }
      this.state.view = 'login';
      this.render();
      return;
    }

    if (hash.startsWith('#chat/')) {
      if (!Auth.check()) {
        window.location.hash = '#login';
        return;
      }
      const chatId = hash.replace('#chat/', '');
      this.state.activeChatId = chatId;
      this.state.view = 'chat-detail';
      this.render();
      this.loadChatMessages(chatId);
      return;
    }

    if (hash === '#chat-list' || hash === '#' || hash === '') {
      if (!Auth.check()) {
        window.location.hash = '#login';
        return;
      }
      this.state.view = 'chat-list';
      this.state.activeChatId = null;
      this.render();
      this.startPolling();
      return;
    }

    // Default redirect
    if (Auth.check()) {
      window.location.hash = '#chat-list';
    } else {
      window.location.hash = '#login';
    }
  },

  /**
   * Render the entire app based on current view state.
   */
  render() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const isMobile = this.state.isMobile;

    switch (this.state.view) {
      case 'login':
        appEl.innerHTML = this._renderLogin();
        this._attachLoginEvents();
        break;

      case 'chat-list':
        if (isMobile) {
          appEl.innerHTML = this._renderMobileChatList();
          this._attachMobileChatListEvents();
        } else {
          appEl.innerHTML = this._renderDesktopDashboard();
          this._attachDesktopEvents();
        }
        break;

      case 'chat-detail':
        if (isMobile) {
          appEl.innerHTML = this._renderMobileChatDetail();
          this._attachMobileChatDetailEvents();
        } else {
          // Desktop: render dashboard with active chat
          appEl.innerHTML = this._renderDesktopDashboard();
          this._attachDesktopEvents();
        }
        // Load messages
        break;
    }
  },

  // ===========================
  //  RENDER — Login
  // ===========================

  _renderLogin() {
    const isMobile = this.state.isMobile;
    if (isMobile) {
      return `
        <div class="ios-statusbar"></div>
        <div class="ios-login-screen">
          <div class="login-icon">💬</div>
          <h1>WhatsApp Dashboard</h1>
          <p class="login-subtitle">Masuk untuk mengelola chat</p>
          <div class="form-group">
            <label for="login-username">Username</label>
            <input type="text" id="login-username" placeholder="Masukkan username" autocomplete="username" autocapitalize="off" />
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" placeholder="Masukkan password" autocomplete="current-password" />
          </div>
          <button class="login-btn" id="login-btn">Masuk</button>
          <div class="login-error" id="login-error"></div>
        </div>
      `;
    }

    // Desktop login
    return `
      <div class="login-screen">
        <div class="login-card">
          <h1>WhatsApp Dashboard</h1>
          <p class="login-subtitle">Masuk untuk mengelola chat</p>
          <div class="form-group">
            <label for="login-username">Username</label>
            <input type="text" id="login-username" placeholder="Masukkan username" autocomplete="username" autocapitalize="off" />
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" placeholder="Masukkan password" autocomplete="current-password" />
          </div>
          <button class="login-btn" id="login-btn">Masuk</button>
          <div class="login-error" id="login-error"></div>
        </div>
      </div>
    `;
  },

  _attachLoginEvents() {
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const errorEl = document.getElementById('login-error');

    const doLogin = async () => {
      const user = usernameInput.value.trim();
      const pass = passwordInput.value.trim();

      if (!user || !pass) {
        errorEl.textContent = 'Username dan password harus diisi';
        errorEl.classList.add('visible');
        return;
      }

      loginBtn.disabled = true;
      loginBtn.textContent = 'Memproses...';
      errorEl.classList.remove('visible');

      try {
        const result = await Auth.login(user, pass);
        if (result.user) {
          this.state.user = result.user;
        }
        window.location.hash = '#chat-list';
      } catch (err) {
        errorEl.textContent = err.message || 'Login gagal. Periksa username dan password.';
        errorEl.classList.add('visible');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Masuk';
      }
    };

    loginBtn.addEventListener('click', doLogin);
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doLogin();
    });
  },

  // ===========================
  //  RENDER — Desktop Dashboard
  // ===========================

  _renderDesktopDashboard() {
    const activeChat = this.state.chats.find(c => {
      const id = c.id || c.chat_id || '';
      return id === this.state.activeChatId;
    });

    const chatListHtml = ChatList.render(this.state.chats, this.state.activeChatId);
    const chatPanelHtml = this.state.activeChatId
      ? ChatView.render(activeChat)
      : `<div class="chat-panel-no-selection">
          <div class="icon">💬</div>
          <div class="text">Pilih percakapan untuk memulai</div>
        </div>`;

    return `
      <div class="macos-titlebar">
        <div class="traffic-lights">
          <span class="traffic-light red"></span>
          <span class="traffic-light yellow"></span>
          <span class="traffic-light green"></span>
        </div>
        <div class="title-text">WhatsApp Dashboard</div>
        <div class="window-controls-spacer">
          <button class="header-action-btn" id="btn-logout" title="Keluar" style="font-size:14px;color:var(--system-gray);">🚪</button>
        </div>
      </div>
      <div class="macos-layout">
        <div class="macos-sidebar">
          <div class="search-container">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input class="search-input" type="text" id="search-input" placeholder="Cari percakapan..." />
            </div>
          </div>
          <div class="chat-list" id="chat-list-sidebar">
            ${chatListHtml}
          </div>
        </div>
        <div class="macos-chat-panel" id="chat-panel">
          ${chatPanelHtml}
        </div>
      </div>
      <div class="macos-statusbar" id="status-bar">
        <span>${this.state.chats.length} percakapan</span>
        <span>${this._countUnread()} belum dibaca</span>
      </div>
    `;
  },

  // ===========================
  //  RENDER — Mobile Chat List
  // ===========================

  _renderMobileChatList() {
    const chatListHtml = ChatList.render(this.state.chats, null);

    return `
      <div class="ios-statusbar"></div>
      <div class="ios-chat-list-screen">
        <div class="ios-nav large-title">
          <div class="nav-title">Pesan</div>
        </div>
        <div class="ios-search-container">
          <div class="ios-search-input-wrap">
            <span class="search-icon">🔍</span>
            <input class="ios-search-input" type="text" id="ios-search-input" placeholder="Cari chat..." />
          </div>
        </div>
        <div class="ios-chat-list" id="ios-chat-list">
          ${chatListHtml}
        </div>
      </div>
      ${this._renderIosTabBar('chat')}
    `;
  },

  // ===========================
  //  RENDER — Mobile Chat Detail
  // ===========================

  _renderMobileChatDetail() {
    const activeChat = this.state.chats.find(c => {
      const id = c.id || c.chat_id || '';
      return id === this.state.activeChatId;
    });
    const name = activeChat ? (activeChat.name || activeChat.contact_name || 'Unknown') : 'Pesan';

    const chatPanelHtml = activeChat
      ? ChatView.render(activeChat)
      : `<div class="chat-messages-empty">
          <div class="chat-messages-empty-icon">💬</div>
          <div>Pilih percakapan</div>
        </div>`;

    return `
      <div class="ios-statusbar"></div>
      <div class="ios-chat-detail-screen">
        <div class="ios-nav">
          <a class="nav-back" href="#chat-list">
            <span class="chevron">◀</span>
            <span>Kembali</span>
          </a>
          <div class="nav-title">${this._escape(name)}</div>
          <div class="nav-right">📋</div>
        </div>
        ${chatPanelHtml}
      </div>
      ${this._renderIosTabBar('chat')}
    `;
  },

  // ===========================
  //  RENDER — iOS Tab Bar
  // ===========================

  _renderIosTabBar(activeTab = 'chat') {
    const tabs = [
      { id: 'chat', icon: '💬', label: 'Chat' },
      { id: 'status', icon: '●', label: 'Status' },
      { id: 'settings', icon: '⚙️', label: 'Settings' },
    ];

    return `
      <div class="ios-tabbar">
        ${tabs.map(t => `
          <div class="tab-item ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}">
            <span class="tab-icon">${t.icon}</span>
            <span class="tab-label">${t.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ===========================
  //  EVENT ATTACHMENT
  // ===========================

  _attachDesktopEvents() {
    // Logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => Auth.logout());
    }

    // Chat list click delegation
    const sidebar = document.getElementById('chat-list-sidebar');
    if (sidebar) {
      sidebar.addEventListener('click', (e) => {
        const item = e.target.closest('.chat-list-item');
        if (item) {
          const chatId = item.dataset.chatId;
          if (chatId) {
            this._selectChat(chatId);
          }
        }
      });
    }

    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        debounceTimer = setTimeout(() => {
          if (query.length > 0) {
            this._searchChats(query);
          } else {
            // Reload full chat list
            Polling.forceFullPoll();
          }
        }, 300);
      });
    }

    // Attach chat view events if active
    if (this.state.activeChatId) {
      const activeChat = this.state.chats.find(c => {
        const id = c.id || c.chat_id || '';
        return id === this.state.activeChatId;
      });
      if (activeChat) {
        ChatView.attachEvents(activeChat, (chatId, content) => this._sendMessage(chatId, content));
        this.renderMessages();
      }
    }
  },

  _attachMobileChatListEvents() {
    const list = document.getElementById('ios-chat-list');
    if (list) {
      list.addEventListener('click', (e) => {
        const item = e.target.closest('.chat-list-item');
        if (item) {
          const chatId = item.dataset.chatId;
          if (chatId) {
            window.location.hash = `#chat/${chatId}`;
          }
        }
      });
    }

    // Search
    const searchInput = document.getElementById('ios-search-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        debounceTimer = setTimeout(() => {
          if (query.length > 0) {
            this._searchChats(query);
          } else {
            Polling.forceFullPoll();
          }
        }, 300);
      });
    }

    // Tab bar
    this._attachTabBarEvents();
  },

  _attachMobileChatDetailEvents() {
    const activeChat = this.state.chats.find(c => {
      const id = c.id || c.chat_id || '';
      return id === this.state.activeChatId;
    });
    if (activeChat) {
      ChatView.attachEvents(activeChat, (chatId, content) => this._sendMessage(chatId, content));
      this.renderMessages();
    }

    // Templates button in nav
    const navRight = document.querySelector('.ios-nav .nav-right');
    if (navRight) {
      navRight.addEventListener('click', () => {
        const { TemplatePicker } = await_import_template();
        // We handle this inline
      });
    }

    this._attachTabBarEvents();
  },

  _attachTabBarEvents() {
    const tabItems = document.querySelectorAll('.tab-item');
    tabItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        if (tab === 'chat') {
          window.location.hash = '#chat-list';
        } else {
          // Status or Settings — show empty state
          this._showIosEmptyState(tab);
        }
      });
    });
  },

  _showIosEmptyState(tab) {
    const titles = { status: 'Status', settings: 'Settings' };
    const icons = { status: '●', settings: '⚙️' };
    const descs = {
      status: 'Fitur status akan sehadir',
      settings: 'Pengaturan akan sehadir',
    };

    const appEl = document.getElementById('app');
    appEl.innerHTML = `
      <div class="ios-statusbar"></div>
      <div style="flex:1;display:flex;flex-direction:column;">
        <div class="ios-empty-state">
          <div class="empty-icon">${icons[tab]}</div>
          <div class="empty-title">${titles[tab]}</div>
          <div class="empty-desc">${descs[tab]}</div>
        </div>
      </div>
      ${this._renderIosTabBar(tab)}
    `;
    this._attachTabBarEvents();
  },

  // ===========================
  //  ACTIONS
  // ===========================

  /**
   * Select a chat and navigate to it.
   */
  _selectChat(chatId) {
    if (this.state.isMobile) {
      window.location.hash = `#chat/${chatId}`;
    } else {
      this.state.activeChatId = chatId;
      Polling.activeChatId = chatId;
      window.location.hash = `#chat/${chatId}`;
      // Re-render the panel portion
      this.renderChatPanel();
      this.loadChatMessages(chatId);
    }
  },

  /**
   * Load messages for a chat.
   */
  async loadChatMessages(chatId) {
    try {
      const messages = await API.getMessages(chatId);
      this.state.messages[chatId] = messages || [];
      this.renderMessages();
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  },

  /**
   * Render messages into the chat panel.
   */
  renderMessages() {
    const chatId = this.state.activeChatId;
    if (!chatId) return;

    const messages = this.state.messages[chatId] || [];
    // Filter out temp messages that might have been replaced
    const realMessages = messages.filter(m => !m.id || !m.id.startsWith('temp-'));
    ChatView.setMessages(realMessages);
  },

  /**
   * Render just the chat panel (desktop).
   */
  renderChatPanel() {
    const panel = document.getElementById('chat-panel');
    if (!panel) return;

    const activeChat = this.state.chats.find(c => {
      const id = c.id || c.chat_id || '';
      return id === this.state.activeChatId;
    });

    if (activeChat) {
      panel.innerHTML = ChatView.render(activeChat);
      ChatView.attachEvents(activeChat, (chatId, content) => this._sendMessage(chatId, content));
      // Re-attach desktop events that involve the panel
      this._attachDesktopPanelEvents();
    } else {
      panel.innerHTML = `
        <div class="chat-panel-no-selection">
          <div class="icon">💬</div>
          <div class="text">Pilih percakapan untuk memulai</div>
        </div>
      `;
    }
  },

  /**
   * Attach events specific to the desktop panel.
   */
  _attachDesktopPanelEvents() {
    // Templates button in chat panel header
    const templatesBtn = document.getElementById('btn-templates');
    if (templatesBtn) {
      templatesBtn.addEventListener('click', () => {
        const { TemplatePicker } = require_or_import_template_picker();
      });
    }
  },

  /**
   * Send a message.
   */
  async _sendMessage(chatId, content) {
    try {
      const result = await API.sendMessage(chatId, content);
      // On next poll, the message will come back with real ID
      // Mark the temp message as sent
      if (result) {
        // Update optimistic message
        this._updateTempMessage(chatId, content);
      }
      // Also mark as read
      API.markRead(chatId).catch(() => {});
    } catch (err) {
      console.error('Send failed:', err);
    }
  },

  /**
   * Mark a temp message as sent (remove temp flag).
   */
  _updateTempMessage(chatId, content) {
    // Messages will be refreshed on next poll
    // Just trigger a quick poll
    Polling.poll();
  },

  /**
   * Search chats.
   */
  async _searchChats(query) {
    try {
      const results = await API.search(query);
      // Replace state.chats temporarily
      const sidebar = document.getElementById('chat-list-sidebar');
      const iosList = document.getElementById('ios-chat-list');

      const html = ChatList.render(results, this.state.activeChatId);

      if (sidebar) sidebar.innerHTML = html;
      if (iosList) iosList.innerHTML = html;
    } catch (err) {
      console.error('Search failed:', err);
    }
  },

  /**
   * Re-render the chat list (sidebar or mobile list).
   */
  renderChatList() {
    const sidebar = document.getElementById('chat-list-sidebar');
    const iosList = document.getElementById('ios-chat-list');

    const html = ChatList.render(this.state.chats, this.state.activeChatId);

    if (sidebar) sidebar.innerHTML = html;
    if (iosList) iosList.innerHTML = html;

    // Update status bar
    const statusBar = document.getElementById('status-bar');
    if (statusBar) {
      statusBar.innerHTML = `
        <span>${this.state.chats.length} percakapan</span>
        <span>${this._countUnread()} belum dibaca</span>
      `;
    }
  },

  // ===========================
  //  POLLING
  // ===========================

  startPolling() {
    Polling.activeChatId = this.state.activeChatId;
    Polling.start(5000);
  },

  // ===========================
  //  STATE HELPERS
  // ===========================

  /**
   * Merge new chats into existing state.
   */
  _mergeChats(newChats) {
    const existingMap = new Map();
    this.state.chats.forEach(c => existingMap.set(c.id || c.chat_id, c));

    newChats.forEach(chat => {
      const id = chat.id || chat.chat_id;
      if (id) {
        existingMap.set(id, { ...(existingMap.get(id) || {}), ...chat });
      } else {
        existingMap.set('_' + Date.now() + Math.random(), chat);
      }
    });

    this.state.chats = Array.from(existingMap.values());
  },

  /**
   * Merge new messages into existing state.
   */
  _mergeMessages(chatId, newMessages) {
    if (!this.state.messages[chatId]) {
      this.state.messages[chatId] = [];
    }

    const existingIds = new Set(this.state.messages[chatId].map(m => m.id));

    newMessages.forEach(msg => {
      if (msg.id && !existingIds.has(msg.id)) {
        this.state.messages[chatId].push(msg);
        existingIds.add(msg.id);
      }
    });
  },

  /**
   * Count total unread messages.
   */
  _countUnread() {
    return this.state.chats.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  },

  /**
   * Escape HTML.
   */
  _escape(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  },
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());

// Fallback if DOM already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  App.init();
}
