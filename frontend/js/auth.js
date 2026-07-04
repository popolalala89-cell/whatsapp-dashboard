import { API, TOKEN_KEY } from './api.js';

/**
 * Auth module — login, logout, check.
 */
const Auth = {
  /**
   * Check if user is authenticated.
   * @returns {boolean}
   */
  check() {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Login with username and password.
   * Stores token in localStorage via API.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<object>} { token, user }
   * @throws {APIError}
   */
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Username dan password harus diisi');
    }
    const result = await API.login(username, password);
    return result;
  },

  /**
   * Logout — clear token and redirect to login.
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new CustomEvent('auth:logout'));
  },

  /**
   * Setup global auth listener — redirect to login on 401 or logout.
   */
  setup() {
    window.addEventListener('auth:unauthorized', () => {
      this.logout();
    });

    window.addEventListener('auth:logout', () => {
      window.location.hash = '#login';
    });
  },
};

export { Auth };
