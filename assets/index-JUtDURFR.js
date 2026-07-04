(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`https://whatsapp-dashboard.popolalala89.workers.dev`,t=`wa_dashboard_token`,n={BASE:e,get token(){return localStorage.getItem(t)},set token(e){e?localStorage.setItem(t,e):localStorage.removeItem(t)},async request(e,t={}){let n=`${this.BASE}${e}`,i={"Content-Type":`application/json`,...t.headers},a=this.token;a&&(i.Authorization=`Bearer ${a}`);try{let e=await fetch(n,{...t,headers:i});if(e.status===401)throw this.token=null,window.dispatchEvent(new CustomEvent(`auth:unauthorized`)),new r(`Sesi telah berakhir. Silakan login kembali.`,401);if(!(e.headers.get(`content-type`)||``).includes(`application/json`)){if(!e.ok)throw new r(`HTTP ${e.status}: ${e.statusText}`,e.status);return null}let a=await e.json();if(!e.ok)throw new r(a.message||a.error||`HTTP ${e.status}`,e.status,a);return a}catch(e){throw e instanceof r?e:new r(e.message||`Gagal terhubung ke server`,0)}},async login(e,t){let n=await this.request(`/api/login`,{method:`POST`,body:JSON.stringify({username:e,password:t})});return n.token&&(this.token=n.token),n},async getChats(e){let t=e?`?since=${encodeURIComponent(e)}`:``,n=await this.request(`/api/chats${t}`);return n.chats||n||[]},async search(e){let t=await this.request(`/api/chats/search?q=${encodeURIComponent(e)}`);return t.chats||t||[]},async getMessages(e,t){let n=t?`?since=${encodeURIComponent(t)}`:``,r=await this.request(`/api/chats/${encodeURIComponent(e)}/messages${n}`);return r.messages||r||[]},async sendMessage(e,t){let n=await this.request(`/api/chats/${encodeURIComponent(e)}/messages`,{method:`POST`,body:JSON.stringify({content:t})});return n.message||n},async markRead(e){return this.request(`/api/chats/${encodeURIComponent(e)}/read`,{method:`POST`})},async getTemplates(){let e=await this.request(`/api/templates`);return e.templates||e||[]},async createTemplate(e,t){return this.request(`/api/templates`,{method:`POST`,body:JSON.stringify({name:e,content:t})})},async getContact(e){return this.request(`/api/contacts/${encodeURIComponent(e)}`)}},r=class extends Error{constructor(e,t,n=null){super(e),this.name=`APIError`,this.status=t,this.data=n}},i={check(){return!!localStorage.getItem(t)},async login(e,t){if(!e||!t)throw Error(`Username dan password harus diisi`);return await n.login(e,t)},logout(){localStorage.removeItem(t),window.dispatchEvent(new CustomEvent(`auth:logout`))},setup(){window.addEventListener(`auth:unauthorized`,()=>{this.logout()}),window.addEventListener(`auth:logout`,()=>{window.location.hash=`#login`})}},a={intervalId:null,lastPollTime:new Date().toISOString(),isPolling:!1,onChatsUpdate:null,onMessagesUpdate:null,onError:null,start(e=5e3){this.intervalId||(this.lastPollTime=new Date().toISOString(),this.intervalId=setInterval(()=>this.poll(),e),this.poll())},stop(){this.intervalId&&=(clearInterval(this.intervalId),null)},activeChatId:null,async poll(){if(!this.isPolling){this.isPolling=!0;try{let e=await n.getChats(this.lastPollTime);if(e&&e.length>0&&this.onChatsUpdate&&this.onChatsUpdate(e),this.activeChatId&&this.onMessagesUpdate){let e=await n.getMessages(this.activeChatId,this.lastPollTime);e&&e.length>0&&this.onMessagesUpdate(this.activeChatId,e)}this.lastPollTime=new Date().toISOString()}catch(e){this.onError&&this.onError(e)}finally{this.isPolling=!1}}},async forceFullPoll(){if(!this.isPolling){this.isPolling=!0;try{let e=await n.getChats();if(e&&this.onChatsUpdate&&this.onChatsUpdate(e),this.activeChatId&&this.onMessagesUpdate){let e=await n.getMessages(this.activeChatId);e&&this.onMessagesUpdate(this.activeChatId,e)}this.lastPollTime=new Date().toISOString()}catch(e){this.onError&&this.onError(e)}finally{this.isPolling=!1}}}},o={render(e,t=null){return!e||e.length===0?`
        <div class="chat-list-empty">
          <div class="chat-list-empty-icon">💬</div>
          <div>Tidak ada percakapan</div>
        </div>
      `:[...e].sort((e,t)=>{let n=e.last_msg_at||e.updated_at||e.created_at||``;return(t.last_msg_at||t.updated_at||t.created_at||``).localeCompare(n)}).map(e=>this._renderItem(e,e.id===t)).join(``)},_renderItem(e,t=!1){let n=e.name||e.contact_name||e.contact?.name||`Unknown`,r=e.last_message||e.last_msg_preview||e.preview||``,i=this._formatTime(e.last_msg_at||e.updated_at||e.created_at),a=e.unread_count||0,o=e.avatar||null,s=n.charAt(0).toUpperCase(),c=e.id||e.chat_id||``;return`
      <div class="chat-list-item ${t?`active`:``}" data-chat-id="${this._escape(c)}">
        <div class="chat-avatar">
          ${o?`<img class="chat-avatar-img" src="${this._escape(o)}" alt="${this._escape(n)}" />`:this._escape(s)}
        </div>
        <div class="chat-info">
          <div class="chat-info-top">
            <span class="chat-name">${this._escape(n)}</span>
            <span class="chat-time">${this._escape(i)}</span>
          </div>
          <div class="chat-info-bottom">
            <span class="chat-preview">${this._escape(r)}</span>
            ${a>0?`<span class="unread-badge">${a>99?`99+`:a}</span>`:``}
          </div>
        </div>
      </div>
    `},_formatTime(e){if(!e)return``;let t=new Date(e);if(isNaN(t.getTime()))return``;let n=new Date;if(n-t<864e5&&t.getDate()===n.getDate())return t.toLocaleTimeString(`id-ID`,{hour:`2-digit`,minute:`2-digit`,hour12:!1});let r=new Date(n);if(r.setDate(r.getDate()-1),t.getDate()===r.getDate()&&t.getMonth()===r.getMonth()&&t.getFullYear()===r.getFullYear())return`Kemarin`;let i=new Date(n);return i.setDate(i.getDate()-6),t>=i?t.toLocaleDateString(`id-ID`,{weekday:`short`}):t.toLocaleDateString(`id-ID`,{day:`numeric`,month:`short`})},_escape(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=String(e),t.innerHTML}},s={async show(e){let t=window.innerWidth<768;try{let r=await n.getTemplates(),i=document.createElement(`div`);i.className=t?`ios-template-overlay`:`template-overlay`,i.id=`template-picker-overlay`;let a=document.createElement(`div`);a.className=t?`ios-template-panel`:`template-panel`;let o=document.createElement(`div`);o.className=`template-panel-header`,o.innerHTML=`
        <h3>Template Pesan</h3>
        <button class="close-btn" aria-label="Tutup">&times;</button>
      `;let s=document.createElement(`div`);s.className=`template-list`,!r||r.length===0?s.innerHTML=`
          <div style="text-align:center;padding:24px;color:var(--system-gray);">
            Belum ada template. Buat template di panel admin.
          </div>
        `:r.forEach(t=>{let n=document.createElement(`button`);n.className=`template-item`,n.innerHTML=`
            <span class="template-item-name">${this._escape(t.name||`Tanpa Nama`)}</span>
            ${this._escape(t.content||t.text||``)}
          `,n.addEventListener(`click`,()=>{let n=t.content||t.text||``;e&&e(n),this._close()}),s.appendChild(n)}),a.appendChild(o),a.appendChild(s),i.appendChild(a),document.body.appendChild(i),o.querySelector(`.close-btn`).addEventListener(`click`,()=>this._close()),i.addEventListener(`click`,e=>{e.target===i&&this._close()}),requestAnimationFrame(()=>{i.style.opacity=`1`})}catch(e){console.error(`Failed to load templates:`,e),alert(`Gagal memuat template: `+e.message)}},_close(){let e=document.getElementById(`template-picker-overlay`);e&&(e.style.opacity=`0`,e.style.transition=`opacity 0.15s ease`,setTimeout(()=>{e.parentNode&&e.parentNode.removeChild(e)},150))},_escape(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}},c={_currentChatId:null,_onSendCallback:null,render(e=null){if(!e)return`
        <div class="chat-panel-no-selection">
          <div class="icon">💬</div>
          <div class="text">Pilih percakapan untuk memulai</div>
        </div>
      `;let t=e.name||e.contact_name||e.contact?.name||`Unknown`,n=e.is_online!==!1,r=e.id||e.chat_id||``;return this._currentChatId=r,`
      <div class="chat-panel-header">
        <div class="contact-info">
          <div class="contact-name">${this._escape(t)}</div>
          <div class="contact-status ${n?``:`offline`}">
            <span class="status-dot"></span>
            ${n?`Online`:`Offline`}
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
    `},attachEvents(e,t){if(!e)return;let n=e.id||e.chat_id||``;this._currentChatId=n,this._onSendCallback=t;let r=document.getElementById(`chat-input`),i=document.getElementById(`btn-send`);r&&i&&(r.addEventListener(`input`,()=>{let e=r.textContent?.trim()||``;i.disabled=e.length===0}),r.addEventListener(`keydown`,e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),this._doSend(n))})),i&&i.addEventListener(`click`,()=>{this._doSend(n)});let a=document.getElementById(`btn-templates`);a&&a.addEventListener(`click`,()=>{s.show(e=>{if(r){r.textContent=e;let t=new Event(`input`,{bubbles:!0});r.dispatchEvent(t),r.focus();let n=document.createRange(),i=window.getSelection();n.selectNodeContents(r),n.collapse(!1),i.removeAllRanges(),i.addRange(n)}})});let o=document.getElementById(`btn-attach`);o&&o.addEventListener(`click`,()=>{})},async _doSend(e){let t=document.getElementById(`chat-input`),r=document.getElementById(`btn-send`);if(!t||!r)return;let i=t.textContent?.trim();if(i)if(this.appendMessage({id:`temp-`+Date.now(),content:i,role:`admin`,created_at:new Date().toISOString(),status:`sending`}),t.textContent=``,r.disabled=!0,this._onSendCallback)this._onSendCallback(e,i);else try{await n.sendMessage(e,i)}catch(e){console.error(`Failed to send message:`,e)}},appendMessage(e){let t=document.getElementById(`chat-messages`);if(!t)return;let n=t.querySelector(`.chat-messages-empty`);n&&n.remove();let r=e.role===`admin`||e.role===`agent`||e.sender===`admin`?`admin`:`customer`,i=this._formatTime(e.created_at||e.timestamp),a=e.content||e.text||``,o=document.createElement(`div`);o.className=`message ${r}`,o.dataset.msgId=e.id||``,o.innerHTML=`
      <div class="message-bubble">${this._escape(a)}</div>
      <div class="message-time-label">${i}</div>
    `,t.appendChild(o),this._scrollToBottom()},setMessages(e){let t=document.getElementById(`chat-messages`);if(!t)return;if(!e||e.length===0){t.innerHTML=`
        <div class="chat-messages-empty">
          <div class="chat-messages-empty-icon">💬</div>
          <div>Belum ada pesan. Kirim pesan pertama!</div>
        </div>
      `;return}let n=this._groupByDate(e);t.innerHTML=``,n.forEach(e=>{if(e.date){let n=document.createElement(`div`);n.className=`message-date-separator`,n.innerHTML=`<span>${e.date}</span>`,t.appendChild(n)}e.messages.forEach(e=>{let n=e.role===`admin`||e.role===`agent`||e.sender===`admin`?`admin`:`customer`,r=this._formatTime(e.created_at||e.timestamp),i=e.content||e.text||``,a=document.createElement(`div`);a.className=`message ${n}`,a.dataset.msgId=e.id||``,a.innerHTML=`
          <div class="message-bubble">${this._escape(i)}</div>
          <div class="message-time-label">${r}</div>
        `,t.appendChild(a)})}),this._scrollToBottom()},_groupByDate(e){let t=[...e].sort((e,t)=>(e.created_at||e.timestamp||``).localeCompare(t.created_at||t.timestamp||``)),n=[],r=``,i=null;return t.forEach(e=>{let t=this._formatDate(e.created_at||e.timestamp);t!==r&&(r=t,i={date:t,messages:[]},n.push(i)),i.messages.push(e)}),n},_scrollToBottom(){let e=document.getElementById(`chat-messages`);e&&requestAnimationFrame(()=>{e.scrollTop=e.scrollHeight})},_formatTime(e){if(!e)return``;let t=new Date(e);return isNaN(t.getTime())?``:t.toLocaleTimeString(`id-ID`,{hour:`2-digit`,minute:`2-digit`,hour12:!1})},_formatDate(e){if(!e)return``;let t=new Date(e);if(isNaN(t.getTime()))return``;let n=new Date,r=(new Date(n.getFullYear(),n.getMonth(),n.getDate())-new Date(t.getFullYear(),t.getMonth(),t.getDate()))/864e5;return r===0?`Hari ini`:r===1?`Kemarin`:r<7?t.toLocaleDateString(`id-ID`,{weekday:`long`}):t.toLocaleDateString(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`})},_escape(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=String(e),t.innerHTML}},l={state:{chats:[],activeChatId:null,messages:{},user:null,view:`login`,isMobile:window.innerWidth<768},async init(){i.setup(),window.addEventListener(`resize`,()=>{let e=this.state.isMobile;this.state.isMobile=window.innerWidth<768,e!==this.state.isMobile&&this.render()}),window.addEventListener(`hashchange`,()=>this.handleRoute()),a.onChatsUpdate=e=>{this._mergeChats(e),this.renderChatList()},a.onMessagesUpdate=(e,t)=>{this._mergeMessages(e,t),this.state.activeChatId===e&&this.renderMessages()},a.onError=e=>{console.error(`Polling error:`,e)},this.handleRoute()},handleRoute(){let e=window.location.hash||`#`;if(e.startsWith(`#login`)){if(i.check()){window.location.hash=`#chat-list`;return}this.state.view=`login`,this.render();return}if(e.startsWith(`#chat/`)){if(!i.check()){window.location.hash=`#login`;return}let t=e.replace(`#chat/`,``);this.state.activeChatId=t,this.state.view=`chat-detail`,this.render(),this.loadChatMessages(t);return}if(e===`#chat-list`||e===`#`||e===``){if(!i.check()){window.location.hash=`#login`;return}this.state.view=`chat-list`,this.state.activeChatId=null,this.render(),this.startPolling();return}i.check()?window.location.hash=`#chat-list`:window.location.hash=`#login`},render(){let e=document.getElementById(`app`);if(!e)return;let t=this.state.isMobile;switch(this.state.view){case`login`:e.innerHTML=this._renderLogin(),this._attachLoginEvents();break;case`chat-list`:t?(e.innerHTML=this._renderMobileChatList(),this._attachMobileChatListEvents()):(e.innerHTML=this._renderDesktopDashboard(),this._attachDesktopEvents());break;case`chat-detail`:t?(e.innerHTML=this._renderMobileChatDetail(),this._attachMobileChatDetailEvents()):(e.innerHTML=this._renderDesktopDashboard(),this._attachDesktopEvents());break}},_renderLogin(){return this.state.isMobile?`
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
      `:`
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
    `},_attachLoginEvents(){let e=document.getElementById(`login-username`),t=document.getElementById(`login-password`),n=document.getElementById(`login-btn`),r=document.getElementById(`login-error`),a=async()=>{let a=e.value.trim(),o=t.value.trim();if(!a||!o){r.textContent=`Username dan password harus diisi`,r.classList.add(`visible`);return}n.disabled=!0,n.textContent=`Memproses...`,r.classList.remove(`visible`);try{let e=await i.login(a,o);e.user&&(this.state.user=e.user),window.location.hash=`#chat-list`}catch(e){r.textContent=e.message||`Login gagal. Periksa username dan password.`,r.classList.add(`visible`),n.disabled=!1,n.textContent=`Masuk`}};n.addEventListener(`click`,a),t.addEventListener(`keydown`,e=>{e.key===`Enter`&&a()})},_renderDesktopDashboard(){let e=this.state.chats.find(e=>(e.id||e.chat_id||``)===this.state.activeChatId);return`
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
            ${o.render(this.state.chats,this.state.activeChatId)}
          </div>
        </div>
        <div class="macos-chat-panel" id="chat-panel">
          ${this.state.activeChatId?c.render(e):`<div class="chat-panel-no-selection">
          <div class="icon">💬</div>
          <div class="text">Pilih percakapan untuk memulai</div>
        </div>`}
        </div>
      </div>
      <div class="macos-statusbar" id="status-bar">
        <span>${this.state.chats.length} percakapan</span>
        <span>${this._countUnread()} belum dibaca</span>
      </div>
    `},_renderMobileChatList(){return`
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
          ${o.render(this.state.chats,null)}
        </div>
      </div>
      ${this._renderIosTabBar(`chat`)}
    `},_renderMobileChatDetail(){let e=this.state.chats.find(e=>(e.id||e.chat_id||``)===this.state.activeChatId),t=e?e.name||e.contact_name||`Unknown`:`Pesan`,n=e?c.render(e):`<div class="chat-messages-empty">
          <div class="chat-messages-empty-icon">💬</div>
          <div>Pilih percakapan</div>
        </div>`;return`
      <div class="ios-statusbar"></div>
      <div class="ios-chat-detail-screen">
        <div class="ios-nav">
          <a class="nav-back" href="#chat-list">
            <span class="chevron">◀</span>
            <span>Kembali</span>
          </a>
          <div class="nav-title">${this._escape(t)}</div>
          <div class="nav-right">📋</div>
        </div>
        ${n}
      </div>
      ${this._renderIosTabBar(`chat`)}
    `},_renderIosTabBar(e=`chat`){return`
      <div class="ios-tabbar">
        ${[{id:`chat`,icon:`💬`,label:`Chat`},{id:`status`,icon:`●`,label:`Status`},{id:`settings`,icon:`⚙️`,label:`Settings`}].map(t=>`
          <div class="tab-item ${t.id===e?`active`:``}" data-tab="${t.id}">
            <span class="tab-icon">${t.icon}</span>
            <span class="tab-label">${t.label}</span>
          </div>
        `).join(``)}
      </div>
    `},_attachDesktopEvents(){let e=document.getElementById(`btn-logout`);e&&e.addEventListener(`click`,()=>i.logout());let t=document.getElementById(`chat-list-sidebar`);t&&t.addEventListener(`click`,e=>{let t=e.target.closest(`.chat-list-item`);if(t){let e=t.dataset.chatId;e&&this._selectChat(e)}});let n=document.getElementById(`search-input`);if(n){let e;n.addEventListener(`input`,t=>{clearTimeout(e);let n=t.target.value.trim();e=setTimeout(()=>{n.length>0?this._searchChats(n):a.forceFullPoll()},300)})}if(this.state.activeChatId){let e=this.state.chats.find(e=>(e.id||e.chat_id||``)===this.state.activeChatId);e&&(c.attachEvents(e,(e,t)=>this._sendMessage(e,t)),this.renderMessages())}},_attachMobileChatListEvents(){let e=document.getElementById(`ios-chat-list`);e&&e.addEventListener(`click`,e=>{let t=e.target.closest(`.chat-list-item`);if(t){let e=t.dataset.chatId;e&&(window.location.hash=`#chat/${e}`)}});let t=document.getElementById(`ios-search-input`);if(t){let e;t.addEventListener(`input`,t=>{clearTimeout(e);let n=t.target.value.trim();e=setTimeout(()=>{n.length>0?this._searchChats(n):a.forceFullPoll()},300)})}this._attachTabBarEvents()},_attachMobileChatDetailEvents(){let e=this.state.chats.find(e=>(e.id||e.chat_id||``)===this.state.activeChatId);e&&(c.attachEvents(e,(e,t)=>this._sendMessage(e,t)),this.renderMessages());let t=document.querySelector(`.ios-nav .nav-right`);t&&t.addEventListener(`click`,()=>{let{TemplatePicker:e}=await_import_template()}),this._attachTabBarEvents()},_attachTabBarEvents(){document.querySelectorAll(`.tab-item`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.tab;t===`chat`?window.location.hash=`#chat-list`:this._showIosEmptyState(t)})})},_showIosEmptyState(e){let t={status:`Status`,settings:`Settings`},n={status:`●`,settings:`⚙️`},r={status:`Fitur status akan sehadir`,settings:`Pengaturan akan sehadir`},i=document.getElementById(`app`);i.innerHTML=`
      <div class="ios-statusbar"></div>
      <div style="flex:1;display:flex;flex-direction:column;">
        <div class="ios-empty-state">
          <div class="empty-icon">${n[e]}</div>
          <div class="empty-title">${t[e]}</div>
          <div class="empty-desc">${r[e]}</div>
        </div>
      </div>
      ${this._renderIosTabBar(e)}
    `,this._attachTabBarEvents()},_selectChat(e){this.state.isMobile?window.location.hash=`#chat/${e}`:(this.state.activeChatId=e,a.activeChatId=e,window.location.hash=`#chat/${e}`,this.renderChatPanel(),this.loadChatMessages(e))},async loadChatMessages(e){try{let t=await n.getMessages(e);this.state.messages[e]=t||[],this.renderMessages()}catch(e){console.error(`Failed to load messages:`,e)}},renderMessages(){let e=this.state.activeChatId;if(!e)return;let t=(this.state.messages[e]||[]).filter(e=>!e.id||!e.id.startsWith(`temp-`));c.setMessages(t)},renderChatPanel(){let e=document.getElementById(`chat-panel`);if(!e)return;let t=this.state.chats.find(e=>(e.id||e.chat_id||``)===this.state.activeChatId);t?(e.innerHTML=c.render(t),c.attachEvents(t,(e,t)=>this._sendMessage(e,t)),this._attachDesktopPanelEvents()):e.innerHTML=`
        <div class="chat-panel-no-selection">
          <div class="icon">💬</div>
          <div class="text">Pilih percakapan untuk memulai</div>
        </div>
      `},_attachDesktopPanelEvents(){let e=document.getElementById(`btn-templates`);e&&e.addEventListener(`click`,()=>{let{TemplatePicker:e}=require_or_import_template_picker()})},async _sendMessage(e,t){try{await n.sendMessage(e,t)&&this._updateTempMessage(e,t),n.markRead(e).catch(()=>{})}catch(e){console.error(`Send failed:`,e)}},_updateTempMessage(e,t){a.poll()},async _searchChats(e){try{let t=await n.search(e),r=document.getElementById(`chat-list-sidebar`),i=document.getElementById(`ios-chat-list`),a=o.render(t,this.state.activeChatId);r&&(r.innerHTML=a),i&&(i.innerHTML=a)}catch(e){console.error(`Search failed:`,e)}},renderChatList(){let e=document.getElementById(`chat-list-sidebar`),t=document.getElementById(`ios-chat-list`),n=o.render(this.state.chats,this.state.activeChatId);e&&(e.innerHTML=n),t&&(t.innerHTML=n);let r=document.getElementById(`status-bar`);r&&(r.innerHTML=`
        <span>${this.state.chats.length} percakapan</span>
        <span>${this._countUnread()} belum dibaca</span>
      `)},startPolling(){a.activeChatId=this.state.activeChatId,a.start(5e3)},_mergeChats(e){let t=new Map;this.state.chats.forEach(e=>t.set(e.id||e.chat_id,e)),e.forEach(e=>{let n=e.id||e.chat_id;n?t.set(n,{...t.get(n)||{},...e}):t.set(`_`+Date.now()+Math.random(),e)}),this.state.chats=Array.from(t.values())},_mergeMessages(e,t){this.state.messages[e]||(this.state.messages[e]=[]);let n=new Set(this.state.messages[e].map(e=>e.id));t.forEach(t=>{t.id&&!n.has(t.id)&&(this.state.messages[e].push(t),n.add(t.id))})},_countUnread(){return this.state.chats.reduce((e,t)=>e+(t.unread_count||0),0)},_escape(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=String(e),t.innerHTML}};document.addEventListener(`DOMContentLoaded`,()=>l.init()),(document.readyState===`complete`||document.readyState===`interactive`)&&l.init();