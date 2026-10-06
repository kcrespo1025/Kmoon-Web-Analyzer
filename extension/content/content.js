(() => {
  if (window.__kmwAnalyzer) {
    window.__kmwAnalyzer.show();
    window.__kmwAnalyzer.handleMessage?.('show-widget');
    return;
  }

  const UI_ID = 'kmoon-web-analyzer-root';
  const MAX_QUEUE = 100;
  const MAX_RENDERED_LOGS = 80;
  const root = document.createElement('div');
  root.id = UI_ID;
  root.style.cssText = 'all:initial;position:fixed;z-index:2147483647;inset:0;pointer-events:none;';
  (document.documentElement || document.body).appendChild(root);
  const shadow = root.attachShadow({ mode: 'closed' });

  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; }
      .launcher {
        position: fixed; top: 50%; left: 12px; transform: translateY(-50%);
        width: 44px; height: 44px; display: none; place-items: center;
        border: 1px solid #334155; border-radius: 50%; background: #0b1220;
        color: #8be9fd; box-shadow: 0 8px 30px #02061799;
        font: 700 14px/1 Arial, sans-serif; cursor: pointer; pointer-events: auto;
      }
      .window {
        position: fixed; top: 50%; left: 12px; transform: translateY(-50%);
        width: min(540px, calc(100vw - 24px)); height: min(680px, calc(100vh - 28px));
        min-height: 320px; display: flex; flex-direction: column; overflow: hidden;
        color: #e5e7eb; background: #0b1220; border: 1px solid #26354c;
        border-radius: 14px; box-shadow: 0 18px 55px #020617aa;
        font: 13px/1.45 Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        pointer-events: auto; resize: both;
      }
      .window[hidden] { display: none; }
      .launcher[hidden] { display: none; }
      .top {
        height: 56px; flex: 0 0 56px; display: flex; align-items: center;
        gap: 10px; padding: 0 12px; border-bottom: 1px solid #1f2a3d;
        background: #101a2b; cursor: grab; user-select: none; touch-action: none;
      }
      .brand { min-width: 0; flex: 1; }
      .brand-name { color: #f8fafc; font-weight: 750; font-size: 14px; letter-spacing: .01em; }
      .brand-sub { color: #91a1b9; font-size: 10px; }
      .live { flex: 0 0 auto; color: #94a3b8; border: 1px solid #334155; border-radius: 99px; padding: 3px 7px; font-size: 9px; font-weight: 800; letter-spacing: .08em; }
      .live.on { color: #6ee7b7; border-color: #166534; background: #052e2b; }
      button {
        color: #dbeafe; background: #172338; border: 1px solid #2b3b53;
        border-radius: 7px; padding: 6px 8px; font: inherit; cursor: pointer;
      }
      button:hover { background: #20304a; }
      button:focus-visible { outline: 2px solid #67e8f9; outline-offset: 2px; }
      .icon { width: 28px; height: 28px; padding: 0; font-size: 18px; line-height: 1; }
      .body { flex: 1; min-height: 0; display: flex; }
      nav {
        width: 128px; flex: 0 0 128px; display: flex; flex-direction: column;
        gap: 4px; padding: 10px 7px; overflow-y: auto; border-right: 1px solid #1f2a3d; background: #0e1726;
      }
      .tab {
        width: 100%; padding: 8px 7px; text-align: left; border-color: transparent;
        color: #9aabc2; background: transparent; font-size: 11px; white-space: nowrap;
      }
      .tab.active { color: #dff8ff; border-color: #244d62; background: #123044; }
      .main { min-width: 0; flex: 1; display: flex; flex-direction: column; padding: 14px; overflow: hidden; }
      .title-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
      h2 { margin: 0; color: #f1f5f9; font-size: 16px; line-height: 1.2; }
      .content { flex: 1; min-height: 0; overflow: auto; scrollbar-color: #334155 transparent; }
      .cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .card, .notice { padding: 11px; border: 1px solid #25344a; border-radius: 9px; background: #111c2c; }
      .metric { display: block; color: #f8fafc; font-size: 21px; font-weight: 750; }
      .muted { color: #91a1b9; font-size: 11px; }
      .notice { margin-top: 10px; color: #cbd5e1; font-size: 11px; }
      .log-list { display: grid; gap: 7px; margin: 0; padding: 0; list-style: none; }
      .log {
        padding: 8px 9px; border: 1px solid #1f3046; border-radius: 8px;
        background: #0e1929; overflow-wrap: anywhere;
      }
      .log-time { display: block; margin-bottom: 3px; color: #71839d; font: 10px/1.3 ui-monospace, Consolas, monospace; }
      .log-message { color: #dbeafe; font-size: 11px; }
      .empty { padding: 16px 8px; text-align: center; color: #8494aa; font-size: 11px; }
      .controls { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
      .primary { color: #041a24; border-color: #67e8f9; background: #67e8f9; font-weight: 800; }
      .primary:hover { background: #a5f3fc; }
      .danger { color: #fecaca; border-color: #7f1d1d; background: #3b121a; }
      .settings { display: grid; gap: 8px; }
      .setting { display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid #25344a; border-radius: 8px; color: #cbd5e1; font-size: 11px; }
      .setting input { accent-color: #67e8f9; }
      .field, select, textarea {
        width: 100%; padding: 8px; border: 1px solid #304158; border-radius: 7px;
        color: #e2e8f0; background: #0c1625; font: 11px/1.4 ui-monospace, Consolas, monospace;
      }
      textarea { min-height: 120px; resize: vertical; }
      .row { display: flex; gap: 6px; margin: 8px 0; }
      .row > * { flex: 1; }
      .log-head { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
      .log-delete { padding: 2px 6px; color: #fca5a5; }
      .workspace-card { cursor: grab; }
      .security-grade { margin: 8px 0; color: #fde68a; font-size: 17px; font-weight: 800; }
      .light {
        color: #172033; background: #f5f7fb; border-color: #cbd5e1;
      }
      .light .top, .light .footer, .light nav { color: #334155; background: #e9eef6; border-color: #cbd5e1; }
      .light .brand-name, .light h2, .light .log-message, .light .footer strong { color: #172033; }
      .light .brand-sub, .light .muted, .light .footer { color: #475569; }
      .light .card, .light .notice, .light .setting, .light .log { color: #172033; background: #fff; border-color: #cbd5e1; }
      .light button { color: #172033; background: #e2e8f0; border-color: #94a3b8; }
      .light .tab { color: #475569; background: transparent; }
      .light .tab.active { color: #0c4a6e; background: #dbeafe; border-color: #7dd3fc; }
      .light textarea, .light select, .light .field { color: #172033; background: #fff; }
      .footer {
        flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between;
        gap: 8px; padding: 8px 12px; border-top: 1px solid #1f2a3d;
        color: #91a1b9; background: #0e1726; font-size: 9px; letter-spacing: .02em;
      }
      .footer strong { color: #c5f6ff; font-weight: 700; }
      @media (max-width: 380px) {
        .window { width: calc(100vw - 16px); left: 8px; height: min(500px, calc(100vh - 16px)); }
        nav { width: 95px; flex-basis: 95px; }
        .main { padding: 10px; }
      }
    </style>
    <button class="launcher" aria-label="Open KMoon Web Analyzer">K</button>
    <section class="window" aria-label="KMoon Web Analyzer floating panel">
      <header class="top">
        <div class="brand">
          <div class="brand-name">KMoon Web Analyzer</div>
          <div class="brand-sub">Local analysis · drag this bar to move</div>
        </div>
        <span class="live" aria-live="polite">● READY</span>
        <button class="icon minimize" aria-label="Minimize panel" title="Minimize">−</button>
        <button class="icon close" aria-label="Hide panel" title="Hide">×</button>
      </header>
      <div class="body">
        <nav aria-label="Analyzer tabs">
          <button class="tab active" data-tab="overview">Overview</button>
          <button class="tab" data-tab="activity">Activity</button>
          <button class="tab" data-tab="network">Network</button>
          <button class="tab" data-tab="javascript">JavaScript</button>
          <button class="tab" data-tab="dom">DOM</button>
          <button class="tab" data-tab="inspector">Inspector</button>
          <button class="tab" data-tab="copier">Site Copier</button>
          <button class="tab" data-tab="live-security">Live Security</button>
          <button class="tab" data-tab="extensions">Extensions</button>
          <button class="tab" data-tab="logs">Logs</button>
          <button class="tab" data-tab="workspace">Workspace</button>
          <button class="tab" data-tab="history">History</button>
          <button class="tab" data-tab="storage">Storage</button>
          <button class="tab" data-tab="source">Source</button>
          <button class="tab" data-tab="search">Search</button>
          <button class="tab" data-tab="security">Security</button>
          <button class="tab" data-tab="settings">Settings</button>
          <button class="tab" data-tab="executor">Code Executor</button>
        </nav>
        <main class="main">
          <div class="title-row"><h2>Overview</h2></div>
          <div class="content"></div>
        </main>
      </div>
      <footer class="footer"><span>© 2026 Kmoon1025</span><strong>KMoon Web Analyzer · Created by Kmoon1025</strong></footer>
    </section>`;

  const windowEl = shadow.querySelector('.window');
  const launcher = shadow.querySelector('.launcher');
  const mainTitle = shadow.querySelector('h2');
  const content = shadow.querySelector('.content');
  const liveBadge = shadow.querySelector('.live');
  const pendingEntries = [];
  let flushTimer = 0;
  let activeTab = 'overview';
  let logs = [];
  let settings = {};
  let analysisActive = false;
  let monitoringPaused = false;
  let observer = null;
  let lastMouseLog = 0;
  let renderTimer = 0;
  let inspecting = false;
  let selectedElementInfo = null;
  let extensionList = [];
  let workspaceItems = [];
  let sessionStartedAt = null;

  const TAB_TITLES = {
    overview: 'Overview',
    activity: 'Live Activity',
    network: 'Network',
    javascript: 'JavaScript',
    dom: 'DOM Changes',
    security: 'Privacy & Security',
    settings: 'Settings',
    inspector: 'Element Inspector',
    copier: 'Site Copier',
    'live-security': 'Live Security',
    extensions: 'Extensions',
    logs: 'Logs',
    workspace: 'Custom Workspace',
    history: 'History',
    executor: 'WebCode Executor',
    storage: 'Storage Inspector',
    source: 'Source Explorer',
    search: 'Search Everything'
  };

  function safeText(value) {
    return String(value == null ? '' : value).replace(/[\r\n\t]+/g, ' ').slice(0, 240);
  }

  function enqueue(category, message, details = {}) {
    if (!analysisActive || monitoringPaused || pendingEntries.length >= MAX_QUEUE) return;
    pendingEntries.push({
      ts: new Date().toISOString(),
      type: category,
      message: safeText(message),
      details,
      url: location.origin + location.pathname
    });
    if (!flushTimer) flushTimer = window.setTimeout(flushEvents, 350);
  }

  function flushEvents() {
    flushTimer = 0;
    if (!pendingEntries.length) return;
    const batch = pendingEntries.splice(0, 40);
    try {
      chrome.runtime.sendMessage({ type: 'log-events', entries: batch }, () => {
        void chrome.runtime.lastError;
      });
    } catch {
      pendingEntries.length = 0;
    }
    if (pendingEntries.length) flushTimer = window.setTimeout(flushEvents, 350);
  }

  function renderLogs(entries) {
    content.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = analysisActive ? 'Waiting for activity on this page…' : 'Press Start to begin monitoring this tab.';
      content.append(empty);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'log-list';
    entries.slice(0, MAX_RENDERED_LOGS).forEach((entry) => {
      const item = document.createElement('li');
      item.className = 'log';
      const time = document.createElement('time');
      time.className = 'log-time';
      time.textContent = new Date(entry.ts || Date.now()).toLocaleTimeString();
      const message = document.createElement('span');
      message.className = 'log-message';
      const info = entry.details || {};
      const extra = info.url ? ` · ${info.method || ''} ${info.url}` : info.statusCode ? ` · HTTP ${info.statusCode}` : '';
      message.textContent = `${entry.message || entry.type}${extra}`;
      item.append(time, message);
      list.append(item);
    });
    content.append(list);
  }

  function render() {
    mainTitle.textContent = TAB_TITLES[activeTab];
    liveBadge.textContent = analysisActive ? '● LIVE' : '● READY';
    liveBadge.classList.toggle('on', analysisActive);
    windowEl.classList.toggle('light', settings.theme === 'light');

    if (activeTab === 'overview') {
      content.replaceChildren();
      const controls = document.createElement('div');
      controls.className = 'controls';
      const startStop = document.createElement('button');
      startStop.className = 'primary';
      startStop.textContent = analysisActive ? 'Stop monitoring' : 'Start monitoring';
      startStop.addEventListener('click', () => setMonitoring(!analysisActive));
      const clear = document.createElement('button');
      clear.textContent = 'Clear activity';
      clear.addEventListener('click', () => {
        logs = [];
        chrome.storage.local.set({ kmwLogs: [] });
        render();
      });
      controls.append(startStop, clear);
      if (analysisActive) {
        const pause = document.createElement('button');
        pause.textContent = monitoringPaused ? 'Resume' : 'Pause';
        pause.addEventListener('click', () => setPaused(!monitoringPaused));
        controls.append(pause);
      }

      const cards = document.createElement('div');
      cards.className = 'cards';
      const networkCount = logs.filter((entry) => entry.type === 'network').length;
      const errors = logs.filter((entry) => entry.type === 'error').length;
      [
        ['Events', logs.length],
        ['Network', networkCount],
        ['Errors', errors],
        ['Page', 'This tab']
      ].forEach(([label, value]) => {
        const card = document.createElement('div');
        card.className = 'card';
        const metric = document.createElement('span');
        metric.className = 'metric';
        metric.textContent = String(value);
        const caption = document.createElement('span');
        caption.className = 'muted';
        caption.textContent = label;
        card.append(metric, caption);
        cards.append(card);
      });

      const notice = document.createElement('div');
      notice.className = 'notice';
      notice.textContent = 'Monitoring starts only when you press Start. Captured activity stays in this browser unless you export it.';
      content.append(controls, cards, notice);
    } else if (activeTab === 'inspector') {
      content.replaceChildren();
      const controls = document.createElement('div');
      controls.className = 'controls';
      const pick = document.createElement('button');
      pick.className = 'primary';
      pick.textContent = inspecting ? 'Cancel element selection' : 'Select element on page';
      pick.addEventListener('click', () => {
        inspecting = !inspecting;
        render();
      });
      controls.append(pick);
      const details = document.createElement('pre');
      details.className = 'notice';
      details.style.whiteSpace = 'pre-wrap';
      details.textContent = selectedElementInfo || 'Choose an element, then click it on the page. Form field values are never shown.';
      content.append(controls, details);
    } else if (activeTab === 'copier') {
      renderCopier();
    } else if (activeTab === 'live-security') {
      renderLiveSecurity();
    } else if (activeTab === 'extensions') {
      renderExtensions();
    } else if (activeTab === 'logs') {
      renderLogsPanel();
    } else if (activeTab === 'workspace') {
      renderWorkspace();
    } else if (activeTab === 'history') {
      renderHistory();
    } else if (activeTab === 'storage') {
      renderStorage();
    } else if (activeTab === 'source') {
      renderSource();
    } else if (activeTab === 'search') {
      renderSearch();
    } else if (activeTab === 'executor') {
      renderExecutor();
    } else if (activeTab === 'settings') {
      content.replaceChildren();
      const group = document.createElement('div');
      group.className = 'settings';
      [
        ['Capture DOM changes', 'domLogging'],
        ['Capture JavaScript events', 'jsLogging'],
        ['Capture network requests', 'networkLogging']
      ].forEach(([label, key]) => {
        const row = document.createElement('label');
        row.className = 'setting';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = settings[key] !== false;
        checkbox.addEventListener('change', () => {
          settings[key] = checkbox.checked;
          chrome.storage.local.set({ kmwSettings: settings });
        });
        const text = document.createElement('span');
        text.textContent = label;
        row.append(checkbox, text);
        group.append(row);
      });
      const privacy = document.createElement('div');
      privacy.className = 'notice';
      privacy.textContent = 'Passwords, typed characters, cookies, and request/response bodies are not recorded. Captured data is stored in this browser.';
      const themeLabel = document.createElement('label');
      themeLabel.className = 'setting';
      themeLabel.textContent = 'Theme';
      const themeSelect = document.createElement('select');
      [['dark', 'Dark'], ['light', 'Light']].forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        themeSelect.append(option);
      });
      themeSelect.value = settings.theme || 'dark';
      themeSelect.addEventListener('change', () => {
        settings.theme = themeSelect.value;
        chrome.storage.local.set({ kmwSettings: settings });
      });
      themeLabel.append(themeSelect);
      content.append(group, themeLabel, privacy);
    } else if (activeTab === 'security') {
      content.replaceChildren();
      const notice = document.createElement('div');
      notice.className = 'notice';
      const meta = document.createElement('div');
      meta.className = 'notice';
      meta.textContent = 'KMoon Web Analyzer 1.2.0 · Official author: Kmoon1025 · Repository: github.com/kcrespo1025/Kmoon-Web-Analyzer. This local attribution check is not a cryptographic signature and cannot prove source identity.';
      notice.textContent = 'LOCAL ONLY. The analyzer does not capture passwords, typed keys, cookies, authorization headers, or request/response bodies. Browser restrictions limit what it can inspect. Website risk indicators are not guarantees.';
      const verification = document.createElement('div');
      verification.className = 'notice';
      verification.textContent = 'Checking official attribution metadata…';
      chrome.runtime.sendMessage({ type: 'verify-metadata' }, (result) => {
        if (activeTab !== 'security') return;
        verification.textContent = chrome.runtime.lastError
          ? `UNVERIFIED · ${chrome.runtime.lastError.message}`
          : result?.verified
            ? `Attribution matches expected project metadata · version ${result.build} · not cryptographically signed.`
            : `UNVERIFIED BUILD · ${(result?.warnings || ['Metadata could not be verified.']).join(' ')}`;
      });
      const permissions = document.createElement('div');
      permissions.className = 'notice';
      permissions.textContent = 'Permissions: current-tab injection, access to supported website request/navigation metadata, local storage, downloads, and Chrome installed-extension management. No cookie permission.';
      const clearData = document.createElement('button');
      clearData.className = 'danger';
      clearData.textContent = 'Delete all local data';
      clearData.addEventListener('click', () => {
        if (!window.confirm('Delete all saved logs, history, scripts, settings, and workspace data from this browser? This cannot be undone.')) return;
        analysisActive = false;
        monitoringPaused = true;
        removeInstrumentation();
        chrome.runtime.sendMessage({ type: 'set-monitoring', enabled: false }, () => {
          chrome.storage.local.clear(() => {
            logs = [];
            workspaceItems = [];
            settings = {};
            render();
          });
        });
      });
      content.append(notice, verification, meta, permissions, clearData);
      content.append(notice);
    } else {
      const typeByTab = {
        network: 'network',
        javascript: 'javascript',
        dom: 'dom',
        activity: null
      };
      const type = typeByTab[activeTab];
      renderLogs(logs.filter((entry) => !type || entry.type === type || (activeTab === 'activity' && entry.type !== 'system')));
    }
  }

  function addNotice(target, text) {
    const notice = document.createElement('div');
    notice.className = 'notice';
    notice.textContent = text;
    target.append(notice);
    return notice;
  }

  function renderCopier() {
    content.replaceChildren();
    addNotice(content, 'Saves the current page HTML as one local file. Form values are removed. It does not crawl linked pages or guarantee the saved page works offline.');
    const button = document.createElement('button');
    button.className = 'primary';
    button.textContent = 'Save current page HTML';
    button.addEventListener('click', () => {
      button.disabled = true;
      button.textContent = 'Creating local snapshot…';
      chrome.runtime.sendMessage({ type: 'capture-current-page' }, (response) => {
        button.disabled = false;
        button.textContent = 'Save current page HTML';
        addNotice(content, chrome.runtime.lastError?.message || response?.error || `Snapshot saved. ${response.bytes} bytes. Offline behavior may differ.`);
        if (response?.ok) {
          chrome.storage.local.get('kmwHistory', ({ kmwHistory = [] }) => {
            const entry = { id: `${Date.now()}`, type: 'page snapshot', url: response.url, title: response.title, ts: new Date().toISOString(), bytes: response.bytes };
            chrome.storage.local.set({ kmwHistory: [entry, ...kmwHistory].slice(0, 100) });
          });
        }
      });
    });
    content.append(button);
  }

  function renderLiveSecurity() {
    content.replaceChildren();
    let pageUrl;
    try {
      pageUrl = new URL(location.href);
    } catch {
      addNotice(content, 'Page security information is unavailable.');
      return;
    }

    const requests = logs.filter((entry) => entry.type === 'network' && entry.details?.url);
    const thirdParty = new Set(requests
      .map((entry) => {
        try { return new URL(entry.details.url).origin; } catch { return ''; }
      })
      .filter((origin) => origin && origin !== pageUrl.origin));
    const knownTrackers = ['google-analytics.com', 'googletagmanager.com', 'doubleclick.net', 'facebook.net', 'hotjar.com', 'segment.io'];
    const trackers = [...thirdParty].filter((origin) => knownTrackers.some((tracker) => {
      const hostname = new URL(origin).hostname;
      return hostname === tracker || hostname.endsWith(`.${tracker}`);
    }));
    const securityHeaders = logs.filter((entry) => entry.message === 'Security headers observed').at(-1);
    const grade = pageUrl.protocol === 'https:' && thirdParty.size < 8 ? 'LOW RISK SIGNALS' : pageUrl.protocol === 'https:' ? 'CAUTION' : 'CAUTION — HTTP';
    const heading = document.createElement('div');
    heading.className = 'security-grade';
    heading.textContent = grade;
    content.append(heading);
    addNotice(content, `Address uses ${pageUrl.protocol === 'https:' ? 'HTTPS' : 'unencrypted HTTP'}. ${thirdParty.size} third-party origins observed; ${trackers.length} match a small built-in analytics/ad domain list.`);
    if (trackers.length) addNotice(content, `Matched third-party origins: ${trackers.join(', ')}`);
    if (securityHeaders) {
      const observed = securityHeaders.details.securityHeaders || [];
      addNotice(content, `Security headers observed: ${observed.length}. Missing from observed response: ${(securityHeaders.details.missingSecurityHeaders || []).length}.`);
      if (securityHeaders.details.contentSecurityPolicyDirectives?.length) addNotice(content, `Content Security Policy directives: ${securityHeaders.details.contentSecurityPolicyDirectives.join(', ')}`);
    } else {
      addNotice(content, 'Response headers are not available yet. Start monitoring and reload this page to collect the main response headers.');
    }
    addNotice(content, 'This is a small set of browser-visible signals—not a certificate audit or a guarantee that the site is safe or unsafe.');
  }

  function renderExtensions() {
    content.replaceChildren();
    addNotice(content, 'Installed extensions are listed from Chrome. Review permissions before disabling or enabling anything. New add-ons are not auto-installed or trusted.');
    const list = document.createElement('div');
    list.className = 'settings';
    content.append(list);
    chrome.runtime.sendMessage({ type: 'list-extensions' }, (response) => {
      if (activeTab !== 'extensions') return;
      list.replaceChildren();
      if (chrome.runtime.lastError || !response?.ok) {
        addNotice(list, response?.error || chrome.runtime.lastError?.message || 'Could not read installed extensions.');
        return;
      }
      extensionList = response.extensions || [];
      const builtIn = document.createElement('div');
      builtIn.className = 'setting';
      builtIn.textContent = 'Built-in · WebCode Executor · v1.2.0 · Kmoon1025 · Client-side JavaScript · Requires explicit confirmation';
      list.append(builtIn);
      if (!extensionList.length) {
        addNotice(list, 'No other extensions found.');
      }
      extensionList.forEach((extension) => {
        const card = document.createElement('div');
        card.className = 'setting';
        const details = document.createElement('div');
        details.style.flex = '1';
        const title = document.createElement('strong');
        title.textContent = `${extension.name} · v${extension.version} · ${extension.enabled ? 'Enabled' : 'Disabled'}`;
        const description = document.createElement('div');
        description.className = 'muted';
        description.textContent = `${extension.installType} · Permissions: ${(extension.permissions || []).join(', ') || 'none listed'}`;
        details.append(title, description);
        const toggle = document.createElement('button');
        toggle.textContent = extension.enabled ? 'Disable' : 'Enable';
        toggle.disabled = !extension.mayDisable;
        toggle.addEventListener('click', () => {
          chrome.runtime.sendMessage({ type: 'toggle-extension', id: extension.id, enabled: !extension.enabled }, (result) => {
            if (chrome.runtime.lastError || !result?.ok) {
              addNotice(card, result?.error || chrome.runtime.lastError?.message || 'Chrome refused the change.');
            } else {
              renderExtensions();
            }
          });
        });
        card.append(details, toggle);
        list.append(card);
      });
      const officialLink = document.createElement('a');
      officialLink.href = 'https://github.com/kcrespo1025/Kmoon-Web-Analyzer';
      officialLink.target = '_blank';
      officialLink.rel = 'noreferrer';
      officialLink.textContent = 'Official repository';
      const releasesLink = document.createElement('a');
      releasesLink.href = 'https://github.com/kcrespo1025/Kmoon-Web-Analyzer/releases';
      releasesLink.target = '_blank';
      releasesLink.rel = 'noreferrer';
      releasesLink.textContent = 'Official releases';
      const submitLink = document.createElement('a');
      submitLink.href = 'https://github.com/kcrespo1025/Kmoon-Web-Analyzer/issues/new';
      submitLink.target = '_blank';
      submitLink.rel = 'noreferrer';
      submitLink.textContent = 'Submit an extension for maintainer review (GitHub issue)';
      list.append(officialLink, releasesLink, submitLink);
    });
  }

  function renderLogsPanel() {
    content.replaceChildren();
    const controls = document.createElement('div');
    controls.className = 'row';
    const search = document.createElement('input');
    search.className = 'field';
    search.placeholder = 'Search event text or URL';
    const filter = document.createElement('select');
    ['All types', 'human', 'network', 'dom', 'javascript', 'navigation', 'system'].forEach((label, index) => {
      const option = document.createElement('option');
      option.value = index === 0 ? '' : label;
      option.textContent = label;
      filter.append(option);
    });
    controls.append(search, filter);

    const actionRow = document.createElement('div');
    actionRow.className = 'controls';
    const pause = document.createElement('button');
    pause.textContent = monitoringPaused ? 'Resume' : 'Pause';
    pause.addEventListener('click', () => setPaused(!monitoringPaused));
    const stop = document.createElement('button');
    stop.className = 'danger';
    stop.textContent = 'Stop';
    stop.addEventListener('click', () => setMonitoring(false));
    const exportSelect = document.createElement('select');
    ['json', 'txt', 'csv', 'html', 'md'].forEach((format) => {
      const option = document.createElement('option');
      option.value = format;
      option.textContent = format.toUpperCase();
      exportSelect.append(option);
    });
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export';
    actionRow.append(pause, stop, exportSelect, exportButton);

    const resultList = document.createElement('div');
    resultList.className = 'settings';
    const filteredEntries = () => logs.filter((entry) => {
      const query = search.value.trim().toLowerCase();
      const searchable = `${entry.type} ${entry.message} ${entry.url} ${JSON.stringify(entry.details || {})}`.toLowerCase();
      return (!filter.value || entry.type === filter.value) && (!query || searchable.includes(query));
    });
    const paint = () => {
      resultList.replaceChildren();
      filteredEntries().slice(0, MAX_RENDERED_LOGS).forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'log';
        const head = document.createElement('div');
        head.className = 'log-head';
        const message = document.createElement('span');
        message.className = 'log-message';
        message.textContent = `${new Date(entry.ts).toLocaleTimeString()} · ${entry.type}: ${entry.message}`;
        const remove = document.createElement('button');
        remove.className = 'log-delete';
        remove.textContent = 'Delete';
        remove.addEventListener('click', () => {
          logs = logs.filter((candidate) => candidate.id !== entry.id);
          chrome.storage.local.set({ kmwLogs: logs });
          paint();
        });
        head.append(message, remove);
        item.append(head);
        if (entry.details?.url) {
          const url = document.createElement('div');
          url.className = 'muted';
          url.textContent = entry.details.url;
          item.append(url);
        }
        resultList.append(item);
      });
      if (!resultList.childElementCount) addNotice(resultList, 'No matching events.');
    };
    search.addEventListener('input', paint);
    filter.addEventListener('change', paint);
    exportButton.addEventListener('click', () => {
      const rows = filteredEntries();
      const format = exportSelect.value;
      let body;
      if (format === 'json') body = JSON.stringify(rows, null, 2);
      else if (format === 'csv') body = ['timestamp,type,message,url', ...rows.map((entry) => [entry.ts, entry.type, entry.message, entry.url].map(csvCell).join(','))].join('\r\n');
      else if (format === 'html') body = `<!doctype html><meta charset="utf-8"><title>KMoon local log export</title><pre>${escapeHtml(JSON.stringify(rows, null, 2))}</pre>`;
      else if (format === 'md') body = rows.map((entry) => `- ${entry.ts} **${entry.type}** ${entry.message} — ${entry.url}`).join('\n');
      else body = rows.map((entry) => `${entry.ts} [${entry.type}] ${entry.message} ${entry.url}`).join('\n');
      downloadText(`kmoon-activity.${format}`, body, format === 'json' ? 'application/json' : 'text/plain');
    });
    paint();
    content.append(controls, actionRow, resultList);
  }

  function csvCell(value) {
    return `"${String(value || '').replace(/"/g, '""')}"`;
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function downloadText(filename, text, mimeType) {
    chrome.runtime.sendMessage({ type: 'download-text', filename, text, mimeType }, (response) => {
      if (chrome.runtime.lastError || !response?.ok) {
        addNotice(content, response?.error || chrome.runtime.lastError?.message || 'Could not download the export.');
      }
    });
  }

  function renderHistory() {
    content.replaceChildren();
    const clear = document.createElement('button');
    clear.className = 'danger';
    clear.textContent = 'Delete all local history';
    clear.addEventListener('click', () => {
      if (!window.confirm('Delete all saved analysis sessions and page snapshot history from this browser? This cannot be undone.')) return;
      chrome.storage.local.set({ kmwHistory: [] }, renderHistory);
    });
    content.append(clear);
    const list = document.createElement('div');
    list.className = 'settings';
    content.append(list);
    chrome.storage.local.get('kmwHistory', ({ kmwHistory = [] }) => {
      if (activeTab !== 'history') return;
      list.replaceChildren();
      if (!kmwHistory.length) {
        addNotice(list, 'No locally saved sessions or page snapshots yet.');
        return;
      }
      kmwHistory.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'setting';
        const text = document.createElement('span');
        text.style.flex = '1';
        text.textContent = `${item.title || item.type || 'Analysis'} · ${item.url || ''} · ${new Date(item.ts).toLocaleString()}`;
        const remove = document.createElement('button');
        remove.textContent = 'Delete';
        remove.addEventListener('click', () => {
          const next = kmwHistory.filter((candidate) => candidate.id !== item.id);
          chrome.storage.local.set({ kmwHistory: next }, renderHistory);
        });
        row.append(text, remove);
        list.append(row);
      });
    });
  }

  function renderWorkspace() {
    content.replaceChildren();
    addNotice(content, 'Personal workspace shortcuts are local to this browser. Drag cards to reorder them.');
    const toolbar = document.createElement('div');
    toolbar.className = 'controls';
    const add = document.createElement('button');
    add.textContent = 'Add shortcut';
    add.addEventListener('click', () => {
      const label = window.prompt('Name this workspace shortcut');
      if (!label?.trim()) return;
      workspaceItems.push(label.trim().slice(0, 40));
      chrome.storage.local.set({ kmwWorkspace: workspaceItems }, renderWorkspace);
    });
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export workspace';
    exportButton.addEventListener('click', () => downloadText('kmoon-workspace.json', JSON.stringify(workspaceItems, null, 2), 'application/json'));
    const importButton = document.createElement('button');
    importButton.textContent = 'Import';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.hidden = true;
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file || file.size > 100000) return;
      try {
        const imported = JSON.parse(await file.text());
        if (!Array.isArray(imported) || !imported.every((item) => typeof item === 'string')) throw new Error('Workspace file must be a JSON list of labels.');
        if (!window.confirm('Imported workspace data is untrusted. It only contains shortcut labels in this version. Import these labels?')) return;
        workspaceItems = imported.slice(0, 100).map((label) => label.slice(0, 40));
        chrome.storage.local.set({ kmwWorkspace: workspaceItems }, renderWorkspace);
      } catch (error) {
        addNotice(content, `Could not import workspace: ${error.message}`);
      }
    });
    importButton.addEventListener('click', () => fileInput.click());
    toolbar.append(add, exportButton, importButton, fileInput);
    const list = document.createElement('div');
    list.className = 'settings';
    workspaceItems.forEach((label, index) => {
      const card = document.createElement('div');
      card.className = 'setting workspace-card';
      card.draggable = true;
      card.textContent = label;
      const remove = document.createElement('button');
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        workspaceItems.splice(index, 1);
        chrome.storage.local.set({ kmwWorkspace: workspaceItems }, renderWorkspace);
      });
      card.append(remove);
      card.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', String(index)));
      card.addEventListener('dragover', (event) => event.preventDefault());
      card.addEventListener('drop', (event) => {
        event.preventDefault();
        const from = Number(event.dataTransfer.getData('text/plain'));
        const [item] = workspaceItems.splice(from, 1);
        workspaceItems.splice(index, 0, item);
        chrome.storage.local.set({ kmwWorkspace: workspaceItems }, renderWorkspace);
      });
      list.append(card);
    });
    if (!workspaceItems.length) addNotice(list, 'No shortcuts yet. Add one to start.');
    content.append(toolbar, list);
  }

  function renderStorage() {
    content.replaceChildren();
    addNotice(content, 'This reads same-origin local/session storage, IndexedDB database names and Cache Storage names. Cookies are never read. Sensitive-key values are masked.');
    const refreshButton = document.createElement('button');
    refreshButton.className = 'primary';
    refreshButton.textContent = 'Inspect current page storage';
    content.append(refreshButton);
    refreshButton.addEventListener('click', () => {
      refreshButton.disabled = true;
      chrome.runtime.sendMessage({ type: 'inspect-page-storage' }, (response) => {
        refreshButton.disabled = false;
        if (chrome.runtime.lastError || !response?.ok) {
          addNotice(content, response?.error || chrome.runtime.lastError?.message || 'Storage inspection failed.');
          return;
        }
        const output = document.createElement('pre');
        output.className = 'notice';
        output.style.whiteSpace = 'pre-wrap';
        output.textContent = JSON.stringify({
          origin: response.origin,
          localStorage: response.local,
          sessionStorage: response.session,
          indexedDB: response.databases,
          cacheNames: response.caches
        }, null, 2);
        content.append(output);
      });
    });
  }

  function renderSource() {
    content.replaceChildren();
    addNotice(content, 'Lists source resources referenced by the current page. Source text is not uploaded or fetched automatically.');
    const inspect = document.createElement('button');
    inspect.className = 'primary';
    inspect.textContent = 'List page sources';
    content.append(inspect);
    inspect.addEventListener('click', () => {
      const resources = [
        ...Array.from(document.scripts, (script) => ({ type: 'JavaScript', url: script.src || '(inline script)' })),
        ...Array.from(document.querySelectorAll('link[rel~="stylesheet"]'), (link) => ({ type: 'CSS', url: link.href })),
        ...Array.from(document.images, (image) => ({ type: 'Image', url: image.currentSrc || image.src }))
      ];
      const output = document.createElement('div');
      output.className = 'settings';
      resources.slice(0, 200).forEach((resource) => {
        const item = document.createElement('div');
        item.className = 'setting';
        item.textContent = `${resource.type} · ${safeDisplayUrl(resource.url)}`;
        output.append(item);
      });
      if (!resources.length) addNotice(output, 'No external source resources found.');
      content.append(output);
    });
  }

  function renderSearch() {
    content.replaceChildren();
    const search = document.createElement('input');
    search.className = 'field';
    search.placeholder = 'Search logs and visible page text';
    const results = document.createElement('div');
    results.className = 'settings';
    const runSearch = () => {
      results.replaceChildren();
      const query = search.value.trim().toLowerCase();
      if (!query) {
        addNotice(results, 'Type to search local activity logs and this page’s visible text.');
        return;
      }
      const logMatches = logs.filter((entry) => `${entry.type} ${entry.message} ${entry.url} ${JSON.stringify(entry.details || {})}`.toLowerCase().includes(query)).slice(0, 50);
      const pageText = (document.body?.innerText || '').slice(0, 100000);
      const pageTextMatch = pageText.toLowerCase().includes(query);
      addNotice(results, `${logMatches.length} log matches${logMatches.length === 50 ? ' (showing first 50)' : ''}; ${pageTextMatch ? 'text found in visible page content' : 'not found in visible page content'}.`);
      logMatches.forEach((entry) => {
        const row = document.createElement('div');
        row.className = 'setting';
        row.textContent = `${entry.ts} · ${entry.type}: ${entry.message}`;
        results.append(row);
      });
    };
    search.addEventListener('input', runSearch);
    content.append(search, results);
  }

  function renderExecutor() {
    content.replaceChildren();
    addNotice(content, 'CLIENT-SIDE EXECUTION: your code runs in this page and can change its visible behavior for your session. Only use code on sites you own or are authorized to test. It does not change the website server. Never paste code you do not understand.');
    const editor = document.createElement('textarea');
    editor.placeholder = '// Authorized client-side test code\nreturn document.title;';
    editor.setAttribute('aria-label', 'Client-side JavaScript code');
    const actions = document.createElement('div');
    actions.className = 'controls';
    const run = document.createElement('button');
    run.className = 'primary';
    run.textContent = 'Run once';
    const save = document.createElement('button');
    save.textContent = 'Save script';
    const clear = document.createElement('button');
    clear.textContent = 'Clear';
    const scripts = document.createElement('select');
    scripts.setAttribute('aria-label', 'Saved scripts');
    const output = document.createElement('pre');
    output.className = 'notice';
    output.style.whiteSpace = 'pre-wrap';
    output.textContent = 'No script executed.';
    chrome.storage.local.get('kmwSavedScripts', ({ kmwSavedScripts = [] }) => {
      scripts.replaceChildren();
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = 'Load saved script';
      scripts.append(blank);
      kmwSavedScripts.forEach((script, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = script.name;
        scripts.append(option);
      });
      scripts.addEventListener('change', () => {
        const script = kmwSavedScripts[Number(scripts.value)];
        if (script) editor.value = script.code;
      });
      save.addEventListener('click', () => {
        if (!editor.value.trim()) return;
        const name = window.prompt('Name this saved script');
        if (!name?.trim()) return;
        chrome.storage.local.set({ kmwSavedScripts: [{ name: name.trim().slice(0, 60), code: editor.value }, ...kmwSavedScripts].slice(0, 30) });
      });
    });
    run.addEventListener('click', () => {
      if (!window.confirm('Run this JavaScript in the current website page? It may change the page or trigger actions as you. Only proceed if you trust and understand the code.')) return;
      run.disabled = true;
      output.textContent = 'Running…';
      chrome.runtime.sendMessage({ type: 'run-page-code', code: editor.value }, (response) => {
        run.disabled = false;
        output.textContent = chrome.runtime.lastError?.message || (response?.ok
          ? `Completed in ${response.durationMs} ms\n${response.result ?? 'undefined'}`
          : `Error: ${response?.error || 'Execution failed.'}`);
      });
    });
    clear.addEventListener('click', () => { editor.value = ''; output.textContent = 'Cleared.'; });
    actions.append(run, save, scripts, clear);
    content.append(editor, actions, output);
  }

  function setPaused(paused) {
    chrome.runtime.sendMessage({ type: 'set-paused', paused }, (response) => {
      if (chrome.runtime.lastError || !response?.ok) {
        addNotice(content, response?.error || chrome.runtime.lastError?.message || 'Could not change pause state.');
        return;
      }
      monitoringPaused = paused;
      render();
    });
  }

  function setMonitoring(enabled) {
    if (analysisActive === enabled) return;
    analysisActive = enabled;
    chrome.runtime.sendMessage({ type: 'set-monitoring', enabled }, (response) => {
      if (chrome.runtime.lastError || !response?.ok) {
        analysisActive = false;
        render();
        const notice = document.createElement('div');
        notice.className = 'notice';
        notice.textContent = response?.error || chrome.runtime.lastError?.message || 'Could not start monitoring this page.';
        content.prepend(notice);
        return;
      }

      if (enabled) {
        sessionStartedAt = Date.now();
        monitoringPaused = false;
        addInstrumentation();
      } else {
        removeInstrumentation();
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = 0;
        }
        flushEvents();
        if (sessionStartedAt && settings.historyEnabled !== false) {
          const historyEntry = {
            id: `${sessionStartedAt}`,
            type: 'analysis session',
            title: document.title.slice(0, 100),
            url: location.origin + location.pathname,
            ts: new Date(sessionStartedAt).toISOString(),
            durationMs: Date.now() - sessionStartedAt,
            eventCount: logs.length
          };
          chrome.storage.local.get('kmwHistory', ({ kmwHistory = [] }) => {
            chrome.storage.local.set({ kmwHistory: [historyEntry, ...kmwHistory].slice(0, 100) });
          });
        }
        sessionStartedAt = null;
        analysisActive = false;
      }
      render();
    });
    render();
  }

  function targetLabel(target) {
    if (!(target instanceof Element)) return 'element';
    let label = target.tagName.toLowerCase();
    if (target.id && !/password|token|auth|session|secret/i.test(target.id)) {
      label += `#${target.id.slice(0, 40)}`;
    }
    if (target.classList.length) label += `.${Array.from(target.classList).slice(0, 2).join('.')}`;
    return label.slice(0, 100);
  }

  function safeMarkup(target) {
    const clone = target.cloneNode(true);
    const elements = [clone, ...clone.querySelectorAll('*')];
    elements.forEach((element) => {
      Array.from(element.attributes).forEach((attribute) => {
        if (/^(value|checked|selected)$/i.test(attribute.name) || /(pass|token|auth|session|secret|credential|card)/i.test(attribute.name)) {
          element.removeAttribute(attribute.name);
        }
      });
      if (element.isContentEditable || element.tagName === 'TEXTAREA') element.textContent = '';
    });
    return clone.outerHTML.slice(0, 1600);
  }

  function safeDisplayUrl(value) {
    try {
      const url = new URL(value);
      url.username = '';
      url.password = '';
      for (const key of url.searchParams.keys()) {
        if (/(pass|token|auth|session|secret|key|credential)/i.test(key)) url.searchParams.set(key, '[REDACTED]');
      }
      url.hash = '';
      return url.href.slice(0, 240);
    } catch {
      return '[invalid URL]';
    }
  }

  function addInstrumentation() {
    if (observer) return;
    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('error', onScriptError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    observer = new MutationObserver((mutations) => {
      if (!analysisActive || settings.domLogging === false) return;
      let added = 0;
      let removed = 0;
      for (const mutation of mutations) {
        added += mutation.addedNodes.length;
        removed += mutation.removedNodes.length;
      }
      if (added || removed) enqueue('dom', 'DOM updated', { added, removed });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    enqueue('activity', 'Page monitoring active', { title: document.title.slice(0, 100) });
  }

  function removeInstrumentation() {
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('submit', onSubmit, true);
    document.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('hashchange', onHashChange);
    window.removeEventListener('error', onScriptError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
    observer?.disconnect();
    observer = null;
  }

  function onClick(event) {
    if (!(event.target instanceof Element) || root.contains(event.target)) return;
    if (inspecting) {
      inspecting = false;
      const target = event.target;
      const computed = getComputedStyle(target);
      selectedElementInfo = [
        `Element: ${targetLabel(target)}`,
        `HTML: ${safeMarkup(target)}`,
        `Link: ${target.closest('a')?.href ? new URL(target.closest('a').href).origin + new URL(target.closest('a').href).pathname : '(none)'}`,
        `Display: ${computed.display}`,
        `Position: ${computed.position}`,
        `Color: ${computed.color}`,
        `Background: ${computed.backgroundColor}`
      ].join('\n');
      event.preventDefault();
      event.stopPropagation();
      render();
      return;
    }
    if (!analysisActive) return;
    enqueue('human', 'Click', { target: targetLabel(event.target) });
  }

  function onSubmit(event) {
    if (!analysisActive) return;
    enqueue('human', 'Form submitted', { method: event.target?.method || 'GET' });
  }

  function onMouseMove(event) {
    if (!analysisActive || root.contains(event.target) || Date.now() - lastMouseLog < 1500) return;
    lastMouseLog = Date.now();
    enqueue('human', 'Pointer moved', { x: event.clientX, y: event.clientY });
  }

  function onHashChange() {
    enqueue('navigation', 'In-page navigation', { url: location.origin + location.pathname });
  }

  function onScriptError() {
    if (settings.jsLogging === false) return;
    enqueue('javascript', 'JavaScript error occurred');
  }

  function onUnhandledRejection() {
    if (settings.jsLogging === false) return;
    enqueue('javascript', 'Unhandled promise rejection occurred');
  }

  function bindTabs() {
    shadow.querySelectorAll('.tab').forEach((button) => {
      button.addEventListener('click', () => {
        activeTab = button.dataset.tab;
        shadow.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab === button));
        render();
      });
    });
  }

  function startDragging(event) {
    if (event.button !== 0 || event.target.closest('button')) return;
    const rect = windowEl.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const onMove = (moveEvent) => {
      const left = Math.max(0, Math.min(window.innerWidth - 80, moveEvent.clientX - offsetX));
      const top = Math.max(0, Math.min(window.innerHeight - 80, moveEvent.clientY - offsetY));
      windowEl.style.left = `${left}px`;
      windowEl.style.top = `${top}px`;
      windowEl.style.transform = 'none';
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      chrome.storage.local.set({
        kmwWidgetPosition: {
          left: windowEl.style.left,
          top: windowEl.style.top
        }
      });
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp, { once: true });
    document.addEventListener('pointercancel', onUp, { once: true });
    event.preventDefault();
  }

  function hidePanel() {
    windowEl.hidden = true;
    launcher.style.display = 'grid';
  }

  function showPanel() {
    windowEl.hidden = false;
    launcher.style.display = 'none';
  }

  shadow.querySelector('.top').addEventListener('pointerdown', startDragging);
  shadow.querySelector('.close').addEventListener('click', hidePanel);
  shadow.querySelector('.minimize').addEventListener('click', hidePanel);
  launcher.addEventListener('click', showPanel);
  bindTabs();

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'show-widget') showPanel();
    if (message?.type === 'resume-monitoring') setMonitoring(true);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.kmwLogs) logs = changes.kmwLogs.newValue || [];
    if (changes.kmwSettings) settings = changes.kmwSettings.newValue || {};
  if (changes.kmwPaused) monitoringPaused = Boolean(changes.kmwPaused.newValue);
    if (renderTimer) return;
    renderTimer = window.setTimeout(() => {
      renderTimer = 0;
      render();
    }, 250);
  });

  chrome.storage.local.get(['kmwLogs', 'kmwSettings', 'kmwWidgetPosition'], (data) => {
    logs = data.kmwLogs || [];
    settings = data.kmwSettings || {};
    chrome.storage.local.get('kmwPaused', ({ kmwPaused = false }) => {
      monitoringPaused = Boolean(kmwPaused);
    });
    if (data.kmwWidgetPosition) {
      windowEl.style.left = data.kmwWidgetPosition.left;
      windowEl.style.top = data.kmwWidgetPosition.top;
      windowEl.style.transform = 'none';
    }
    render();
  });
  chrome.storage.local.get(['kmwWorkspace', 'kmwPaused'], (data) => {
    workspaceItems = Array.isArray(data.kmwWorkspace) ? data.kmwWorkspace.filter((item) => typeof item === 'string').slice(0, 100) : [];
    monitoringPaused = Boolean(data.kmwPaused);
    render();
  });

  window.__kmwAnalyzer = {
    show: showPanel,
    hide: hidePanel,
    handleMessage: (type) => {
      if (type === 'show-widget') showPanel();
    },
    remove: () => {
      removeInstrumentation();
      root.remove();
      delete window.__kmwAnalyzer;
    }
  };
})();
