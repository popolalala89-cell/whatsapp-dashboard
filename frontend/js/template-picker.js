import { API } from './api.js';

/**
 * Template picker — shows quick reply templates.
 */
const TemplatePicker = {
  /**
   * Show the template picker overlay.
   * @param {function(string)} onSelect - callback receiving selected template content
   */
  async show(onSelect) {
    const isMobile = window.innerWidth < 768;

    try {
      const templates = await API.getTemplates();

      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = isMobile ? 'ios-template-overlay' : 'template-overlay';
      overlay.id = 'template-picker-overlay';

      const panel = document.createElement('div');
      panel.className = isMobile ? 'ios-template-panel' : 'template-panel';

      // Header
      const header = document.createElement('div');
      header.className = 'template-panel-header';
      header.innerHTML = `
        <h3>Template Pesan</h3>
        <button class="close-btn" aria-label="Tutup">&times;</button>
      `;

      // List
      const list = document.createElement('div');
      list.className = 'template-list';

      if (!templates || templates.length === 0) {
        list.innerHTML = `
          <div style="text-align:center;padding:24px;color:var(--system-gray);">
            Belum ada template. Buat template di panel admin.
          </div>
        `;
      } else {
        templates.forEach(tpl => {
          const btn = document.createElement('button');
          btn.className = 'template-item';
          btn.innerHTML = `
            <span class="template-item-name">${this._escape(tpl.name || 'Tanpa Nama')}</span>
            ${this._escape(tpl.content || tpl.text || '')}
          `;
          btn.addEventListener('click', () => {
            const content = tpl.content || tpl.text || '';
            if (onSelect) onSelect(content);
            this._close();
          });
          list.appendChild(btn);
        });
      }

      panel.appendChild(header);
      panel.appendChild(list);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      // Close handlers
      const closeBtn = header.querySelector('.close-btn');
      closeBtn.addEventListener('click', () => this._close());

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this._close();
        }
      });

      // Animate in
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
      });

    } catch (err) {
      console.error('Failed to load templates:', err);
      alert('Gagal memuat template: ' + err.message);
    }
  },

  /**
   * Close the template picker.
   */
  _close() {
    const overlay = document.getElementById('template-picker-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.15s ease';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 150);
    }
  },

  /**
   * Escape HTML entities.
   */
  _escape(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};

export { TemplatePicker };
