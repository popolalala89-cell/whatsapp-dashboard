import { API } from './api.js';
import { TemplatePicker } from './template-picker.js';

/**
 * Chat View — renders the main chat panel with messages and input.
 */
const ChatView = {
  _currentChatId: null,
  _onSendCallback: null,

  /**
   * Render the chat panel HTML structure (empty, waiting for messages).
   * @param {object|null} chat - current chat object
   * @returns {string} HTML
   */
  render(chat = null) {
    if (!chat) {
      return `
        <div class="chat-panel-no-selection">
          <div class="icon">💬</div>
          <div class="text">Pilih percakapan untuk memulai</div>
        </div>
      `;
    }

    const name = chat.name || chat.contact_name || chat.contact?.name || 'Unknown';
    const isOnline = chat.is_online !== false; // default online
    const id = chat.id || chat.chat_id || '';

    this._currentChatId = id;

    return `
      <div class="chat-panel-header">
        <div class="contact-info">
          <div class="contact-name">${this._escape(name)}</div>
          <div class="contact-status ${isOnline ? '' : 'offline'}">
            <span class="status-dot"></span>
            ${isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        <div class="header-actions">
          <button class="header-action-btn" title="Templates" id="btn-templates">📋</button>
          <button class="header-action-btn" title="Info" id="btn-info">ℹ️</button>
        </div>
      </div>
      <div class="chat-messages" id="chat-messages">
        <div class="chat-messages-empty">
          <div class="chat-messages-empty-icon">💬</div>
          <div>Belum ada pesan. Kirim pesan pertama!</div>
        </div>
      </div>
      <div class="chat-input-bar">
        <button class="input-action-btn" id="btn-attach" title="Lampiran">📎</button>
        <div class="input-field" id="chat-input" contenteditable="true" role="textbox" aria-multiline="true" placeholder="Ketik pesan..."></div>
        <button class="send-btn" id="btn-send" title="Kirim" disabled>➤</button>
      </div>
    `;
  },

  /**
   * Attach event listeners to the chat panel.
   * @param {object} chat - current chat object
   * @param {function} onSend - callback(chatId, content) when message is sent
   */
  attachEvents(chat, onSend) {
    if (!chat) return;

    const chatId = chat.id || chat.chat_id || '';
    this._currentChatId = chatId;
    this._onSendCallback = onSend;

    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('btn-send');

    // Send button state
    if (input && sendBtn) {
      const updateSendBtn = () => {
        const text = input.textContent?.trim() || '';
        sendBtn.disabled = text.length === 0;
      };

      input.addEventListener('input', updateSendBtn);
      input.addEventListener('keydown', (e) => {
        // Enter to send (Shift+Enter for new line)
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this._doSend(chatId);
        }
      });
    }

    // Send button click
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        this._doSend(chatId);
      });
    }

    // Templates button
    const templatesBtn = document.getElementById('btn-templates');
    if (templatesBtn) {
      templatesBtn.addEventListener('click', () => {
        TemplatePicker.show((content) => {
          if (input) {
            input.textContent = content;
            // Trigger input event to enable send button
            const evt = new Event('input', { bubbles: true });
            input.dispatchEvent(evt);
            input.focus();
            // Place cursor at end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(input);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        });
      });
    }

    // Attach button (non-functional for now)
    const attachBtn = document.getElementById('btn-attach');
    if (attachBtn) {
      attachBtn.addEventListener('click', () => {
        // Future: file picker
      });
    }
  },

  /**
   * Actually send the message.
   */
  async _doSend(chatId) {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('btn-send');
    if (!input || !sendBtn) return;

    const content = input.textContent?.trim();
    if (!content) return;

    // Optimistic append
    this.appendMessage({
      id: 'temp-' + Date.now(),
      content: content,
      role: 'admin',
      created_at: new Date().toISOString(),
      status: 'sending',
    });

    // Clear input
    input.textContent = '';
    sendBtn.disabled = true;

    // Send via API
    if (this._onSendCallback) {
      this._onSendCallback(chatId, content);
    } else {
      try {
        await API.sendMessage(chatId, content);
      } catch (err) {
        console.error('Failed to send message:', err);
        // Could show error state
      }
    }
  },

  /**
   * Append a message to the messages area.
   * @param {object} msg - message object
   */
  appendMessage(msg) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    // Remove empty state if present
    const empty = container.querySelector('.chat-messages-empty');
    if (empty) empty.remove();

    const isAdmin = msg.role === 'admin' || msg.role === 'agent' || msg.sender === 'admin';
    const side = isAdmin ? 'admin' : 'customer';
    const time = this._formatTime(msg.created_at || msg.timestamp);
    const content = msg.content || msg.text || '';

    const bubble = document.createElement('div');
    bubble.className = `message ${side}`;
    bubble.dataset.msgId = msg.id || '';
    bubble.innerHTML = `
      <div class="message-bubble">${this._escape(content)}</div>
      <div class="message-time-label">${time}</div>
    `;

    container.appendChild(bubble);
    this._scrollToBottom();
  },

  /**
   * Set messages (replace all).
   * @param {Array} messages
   */
  setMessages(messages) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    if (!messages || messages.length === 0) {
      container.innerHTML = `
        <div class="chat-messages-empty">
          <div class="chat-messages-empty-icon">💬</div>
          <div>Belum ada pesan. Kirim pesan pertama!</div>
        </div>
      `;
      return;
    }

    // Group messages by date
    const groups = this._groupByDate(messages);

    container.innerHTML = '';

    groups.forEach((group) => {
      // Date separator
      if (group.date) {
        const sep = document.createElement('div');
        sep.className = 'message-date-separator';
        sep.innerHTML = `<span>${group.date}</span>`;
        container.appendChild(sep);
      }

      group.messages.forEach(msg => {
        const isAdmin = msg.role === 'admin' || msg.role === 'agent' || msg.sender === 'admin';
        const side = isAdmin ? 'admin' : 'customer';
        const time = this._formatTime(msg.created_at || msg.timestamp);
        const content = msg.content || msg.text || '';

        const bubble = document.createElement('div');
        bubble.className = `message ${side}`;
        bubble.dataset.msgId = msg.id || '';
        bubble.innerHTML = `
          <div class="message-bubble">${this._escape(content)}</div>
          <div class="message-time-label">${time}</div>
        `;
        container.appendChild(bubble);
      });
    });

    this._scrollToBottom();
  },

  /**
   * Group messages by date.
   * @param {Array} messages
   * @returns {Array<{date: string, messages: Array}>}
   */
  _groupByDate(messages) {
    const sorted = [...messages].sort((a, b) => {
      return (a.created_at || a.timestamp || '').localeCompare(b.created_at || b.timestamp || '');
    });

    const groups = [];
    let currentDate = '';
    let currentGroup = null;

    sorted.forEach(msg => {
      const dateStr = this._formatDate(msg.created_at || msg.timestamp);
      if (dateStr !== currentDate) {
        currentDate = dateStr;
        currentGroup = { date: dateStr, messages: [] };
        groups.push(currentGroup);
      }
      currentGroup.messages.push(msg);
    });

    return groups;
  },

  /**
   * Scroll messages container to bottom.
   */
  _scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  },

  /**
   * Format timestamp to time string.
   */
  _formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  },

  /**
   * Format timestamp to date string.
   */
  _formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = (today - msgDate) / 86400000;

    if (diff === 0) return 'Hari ini';
    if (diff === 1) return 'Kemarin';
    if (diff < 7) {
      return date.toLocaleDateString('id-ID', { weekday: 'long' });
    }
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
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

export { ChatView };
