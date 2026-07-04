/**
 * Chat List component — renders sidebar/chat list items.
 */
const ChatList = {
  /**
   * Render chat list HTML.
   * @param {Array} chats - array of chat objects
   * @param {string|null} activeChatId - currently selected chat ID
   * @returns {string} HTML string
   */
  render(chats, activeChatId = null) {
    if (!chats || chats.length === 0) {
      return `
        <div class="chat-list-empty">
          <div class="chat-list-empty-icon">💬</div>
          <div>Tidak ada percakapan</div>
        </div>
      `;
    }

    // Sort by last_msg_at descending (most recent first)
    const sorted = [...chats].sort((a, b) => {
      const aTime = a.last_msg_at || a.updated_at || a.created_at || '';
      const bTime = b.last_msg_at || b.updated_at || b.created_at || '';
      return bTime.localeCompare(aTime);
    });

    return sorted.map(chat => this._renderItem(chat, chat.id === activeChatId)).join('');
  },

  /**
   * Render a single chat list item.
   * @param {object} chat
   * @param {boolean} isActive
   * @returns {string}
   */
  _renderItem(chat, isActive = false) {
    const name = chat.name || chat.contact_name || chat.contact?.name || 'Unknown';
    const preview = chat.last_message || chat.last_msg_preview || chat.preview || '';
    const time = this._formatTime(chat.last_msg_at || chat.updated_at || chat.created_at);
    const unread = chat.unread_count || 0;
    const avatar = chat.avatar || null;
    const firstLetter = name.charAt(0).toUpperCase();
    const id = chat.id || chat.chat_id || '';

    return `
      <div class="chat-list-item ${isActive ? 'active' : ''}" data-chat-id="${this._escape(id)}">
        <div class="chat-avatar">
          ${avatar ? `<img class="chat-avatar-img" src="${this._escape(avatar)}" alt="${this._escape(name)}" />` : this._escape(firstLetter)}
        </div>
        <div class="chat-info">
          <div class="chat-info-top">
            <span class="chat-name">${this._escape(name)}</span>
            <span class="chat-time">${this._escape(time)}</span>
          </div>
          <div class="chat-info-bottom">
            <span class="chat-preview">${this._escape(preview)}</span>
            ${unread > 0 ? `<span class="unread-badge">${unread > 99 ? '99+' : unread}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Format timestamp to readable time.
   * @param {string} timestamp - ISO string or similar
   * @returns {string}
   */
  _formatTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diff = now - date;
    const oneDay = 86400000; // 24 hours in ms

    // Today — show time
    if (diff < oneDay && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()) {
      return 'Kemarin';
    }

    // This week
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6);
    if (date >= weekAgo) {
      return date.toLocaleDateString('id-ID', { weekday: 'short' });
    }

    // Older
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
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

export { ChatList };
