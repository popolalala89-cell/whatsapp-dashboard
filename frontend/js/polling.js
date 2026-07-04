import { API } from './api.js';

/**
 * Polling manager — periodically fetches chats and messages.
 */
const Polling = {
  intervalId: null,
  lastPollTime: new Date().toISOString(),
  isPolling: false,

  // Callbacks — set by app
  onChatsUpdate: null,   // function(chats[])
  onMessagesUpdate: null, // function(chatId, messages[])
  onError: null,          // function(error)

  /**
   * Start polling every `intervalMs` milliseconds.
   * @param {number} [intervalMs=5000]
   */
  start(intervalMs = 5000) {
    if (this.intervalId) return;
    this.lastPollTime = new Date().toISOString();
    this.intervalId = setInterval(() => this.poll(), intervalMs);
    // Do an immediate first poll
    this.poll();
  },

  /**
   * Stop polling.
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  /**
   * Get the current active chat ID to also poll messages.
   * Set by app as needed.
   */
  activeChatId: null,

  /**
   * Perform a poll cycle.
   */
  async poll() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      // 1. Fetch chats updated since last poll
      const chats = await API.getChats(this.lastPollTime);

      if (chats && chats.length > 0 && this.onChatsUpdate) {
        this.onChatsUpdate(chats);
      }

      // 2. If an active chat is set, also poll its messages
      if (this.activeChatId && this.onMessagesUpdate) {
        const messages = await API.getMessages(this.activeChatId, this.lastPollTime);
        if (messages && messages.length > 0) {
          this.onMessagesUpdate(this.activeChatId, messages);
        }
      }

      this.lastPollTime = new Date().toISOString();
    } catch (err) {
      if (this.onError) {
        this.onError(err);
      }
    } finally {
      this.isPolling = false;
    }
  },

  /**
   * Force a full poll (no since filter — gets everything).
   */
  async forceFullPoll() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const chats = await API.getChats();
      if (chats && this.onChatsUpdate) {
        this.onChatsUpdate(chats);
      }

      if (this.activeChatId && this.onMessagesUpdate) {
        const messages = await API.getMessages(this.activeChatId);
        if (messages) {
          this.onMessagesUpdate(this.activeChatId, messages);
        }
      }

      this.lastPollTime = new Date().toISOString();
    } catch (err) {
      if (this.onError) {
        this.onError(err);
      }
    } finally {
      this.isPolling = false;
    }
  },
};

export { Polling };
