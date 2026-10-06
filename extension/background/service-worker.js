const OFFICIAL_META = {
  projectName: 'KMoon Web Analyzer',
  author: 'Kmoon1025',
  repository: 'https://github.com/kcrespo1025/Kmoon-Web-Analyzer',
  license: 'MIT',
  buildVersion: '1.2.0',
  buildId: 'kmw-2026.10.06-overlay',
  localOnly: true
};

const DEFAULT_SETTINGS = {
  theme: 'dark',
  liveLogging: true,
  networkLogging: true,
  jsLogging: true,
  domLogging: true,
  maxPages: 50,
  maxFileSizeMb: 50,
  crawlDepth: 2,
  requestsPerSecond: 5,
  sameDomainOnly: true,
  historyEnabled: true,
  privacyMode: 'mask-sensitive',
  uiPosition: 'left',
  uiSize: 'medium'
};

const MAX_LOGS = 500;
const requestStartedAt = new Map();
const SENSITIVE_QUERY_PARAM = /(password|token|auth|session|cookie|secret|credit[-_ ]?card|api[-_ ]?key)/i;
let logWriteQueue = Promise.resolve();
let pendingLogs = [];
let pendingLogTimer = 0;
const captureState = { enabled: false, paused: false, activeTabId: null, settings: DEFAULT_SETTINGS };
const captureStateReady = chrome.storage.local.get([
  'kmwEnabled',
  'kmwPaused',
  'kmwActiveTabId',
  'kmwSettings'
]).then((data) => {
  captureState.enabled = Boolean(data.kmwEnabled);
  captureState.paused = Boolean(data.kmwPaused);
  captureState.activeTabId = data.kmwActiveTabId ?? null;
  captureState.settings = { ...DEFAULT_SETTINGS, ...(data.kmwSettings || {}) };
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.kmwEnabled) captureState.enabled = Boolean(changes.kmwEnabled.newValue);
  if (changes.kmwPaused) captureState.paused = Boolean(changes.kmwPaused.newValue);
  if (changes.kmwActiveTabId) captureState.activeTabId = changes.kmwActiveTabId.newValue ?? null;
  if (changes.kmwSettings) captureState.settings = { ...DEFAULT_SETTINGS, ...(changes.kmwSettings.newValue || {}) };
});

function sanitizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    url.username = '';
    url.password = '';
    for (const key of url.searchParams.keys()) {
      if (SENSITIVE_QUERY_PARAM.test(key)) {
        url.searchParams.set(key, '[REDACTED]');
      }
    }
    if (url.hash) {
      url.hash = '';
    }
    return url.href;
  } catch {
    return '[invalid URL]';
  }
}

async function getActiveCaptureSettings(tabId) {
  await captureStateReady;
  return captureState.enabled
    && !captureState.paused
    && captureState.activeTabId === tabId
    && captureState.settings.networkLogging !== false;
}

async function logWebRequest(details, message, extraDetails = {}) {
  if (!(await getActiveCaptureSettings(details.tabId))) {
    return;
  }

  const requestUrl = new URL(details.url);
  let initiator = '';
  try {
    initiator = details.initiator ? new URL(details.initiator).origin : '';
  } catch {
    initiator = '';
  }
  const crossOrigin = Boolean(initiator && initiator !== requestUrl.origin);
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ts: new Date(details.timeStamp).toISOString(),
    type: 'network',
    message,
    details: {
      method: details.method,
      url: sanitizeUrl(details.url),
      resourceType: details.type,
      initiator,
      crossOrigin,
      ...extraDetails
    },
    url: sanitizeUrl(details.url)
  };
  queueLogEntries([entry]);
}

function getVerificationState() {
  const manifest = chrome.runtime.getManifest();
  const result = {
    verified: true,
    build: manifest.version,
    author: OFFICIAL_META.author,
    projectName: manifest.name,
    repository: manifest.homepage_url || OFFICIAL_META.repository,
    warnings: []
  };

  if (!manifest.name || manifest.name !== OFFICIAL_META.projectName) {
    result.verified = false;
    result.warnings.push('Project name metadata is missing or modified.');
  }

  if (manifest.version !== OFFICIAL_META.buildVersion) {
    result.verified = false;
    result.warnings.push('Build version does not match the expected release metadata.');
  }

  if (!manifest.homepage_url || manifest.homepage_url !== OFFICIAL_META.repository) {
    result.verified = false;
    result.warnings.push('Official repository attribution is missing or modified.');
  }

  return result;
}

function writeLogEntries(entries) {
  logWriteQueue = logWriteQueue.catch(() => undefined).then(async () => {
    const { kmwLogs = [] } = await chrome.storage.local.get('kmwLogs');
    await chrome.storage.local.set({
      kmwLogs: [...entries.slice().reverse(), ...kmwLogs].slice(0, MAX_LOGS)
    });
  });
  return logWriteQueue;
}

function queueLogEntries(entries) {
  pendingLogs.push(...entries);
  if (pendingLogs.length > 300) pendingLogs = pendingLogs.slice(-300);
  if (!pendingLogTimer) {
    pendingLogTimer = setTimeout(flushPendingLogs, 400);
  }
}

function flushPendingLogs() {
  pendingLogTimer = 0;
  if (!pendingLogs.length) return;
  const batch = pendingLogs.splice(0, 120);
  writeLogEntries(batch).catch((error) => console.error('Could not save activity:', error));
  if (pendingLogs.length) pendingLogTimer = setTimeout(flushPendingLogs, 400);
}

async function setAnalysisForTab(tabId, enabled) {
  if (!Number.isInteger(tabId)) {
    throw new Error('The current page cannot be monitored.');
  }
  await chrome.storage.local.set({
    kmwEnabled: enabled,
    kmwPaused: false,
    kmwActiveTabId: enabled ? tabId : null
  });
  captureState.enabled = enabled;
  captureState.paused = false;
  captureState.activeTabId = enabled ? tabId : null;
}

async function injectWidget(tabId) {
  if (!Number.isInteger(tabId)) {
    throw new Error('Open a regular webpage before launching the analyzer.');
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content/content.js']
  });
  await chrome.tabs.sendMessage(tabId, { type: 'show-widget' });
}

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get([
    'kmwEnabled',
    'kmwLogs',
    'kmwHistory',
    'kmwSettings'
  ]);
  await chrome.storage.local.set({
    kmwEnabled: data.kmwEnabled ?? false,
    kmwLogs: data.kmwLogs ?? [],
    kmwHistory: data.kmwHistory ?? [],
    kmwSettings: { ...DEFAULT_SETTINGS, ...(data.kmwSettings || {}) },
    kmwVerification: getVerificationState(),
    kmwOfficialMeta: OFFICIAL_META
  });
});

chrome.runtime.onStartup.addListener(async () => {
  await chrome.storage.local.set({
    kmwVerification: getVerificationState(),
    kmwOfficialMeta: OFFICIAL_META
  });
});

chrome.action.onClicked.addListener((tab) => {
  injectWidget(tab.id).catch((error) => {
    console.error('KMoon Web Analyzer could not open on this page:', error);
  });
});

chrome.webRequest.onBeforeRequest.addListener((details) => {
  requestStartedAt.set(details.requestId, details.timeStamp);
}, { urls: ['<all_urls>'] });

chrome.webRequest.onCompleted.addListener((details) => {
  const startedAt = requestStartedAt.get(details.requestId);
  requestStartedAt.delete(details.requestId);
  logWebRequest(details, 'Request complete', {
    statusCode: details.statusCode,
    durationMs: startedAt === undefined ? null : Math.round(details.timeStamp - startedAt)
  }).catch((error) => console.error('Could not save a network event:', error));
}, { urls: ['<all_urls>'] });

chrome.webRequest.onErrorOccurred.addListener((details) => {
  const startedAt = requestStartedAt.get(details.requestId);
  requestStartedAt.delete(details.requestId);
  logWebRequest(details, 'Request failed', {
    error: details.error,
    durationMs: startedAt === undefined ? null : Math.round(details.timeStamp - startedAt)
  }).catch((error) => console.error('Could not save a failed network event:', error));
}, { urls: ['<all_urls>'] });

chrome.webRequest.onBeforeRedirect.addListener((details) => {
  logWebRequest(details, 'Redirect', {
    statusCode: details.statusCode,
    redirectUrl: sanitizeUrl(details.redirectUrl)
  }).catch((error) => console.error('Could not save a redirect event:', error));
}, { urls: ['<all_urls>'] });

chrome.webRequest.onHeadersReceived.addListener((details) => {
  if (details.type !== 'main_frame') return;
  const headers = Object.fromEntries((details.responseHeaders || []).map(({ name, value }) => [
    name.toLowerCase(),
    value || ''
  ]));
  const securityHeaders = [
    'strict-transport-security',
    'content-security-policy',
    'x-content-type-options',
    'x-frame-options',
    'referrer-policy',
    'permissions-policy',
    'cross-origin-opener-policy',
    'cross-origin-resource-policy',
    'cross-origin-embedder-policy'
  ];
  const present = securityHeaders.filter((name) => headers[name]);
  logWebRequest(details, 'Security headers observed', {
    securityHeaders: present,
    missingSecurityHeaders: securityHeaders.filter((name) => !headers[name]),
    contentSecurityPolicyDirectives: (headers['content-security-policy'] || '')
      .split(';')
      .map((directive) => directive.trim().split(/\s+/)[0])
      .filter(Boolean)
  }).catch((error) => console.error('Could not save response security headers:', error));
}, { urls: ['<all_urls>'] }, ['responseHeaders']);

chrome.webNavigation.onCompleted.addListener(async (details) => {
  const { kmwEnabled = false, kmwActiveTabId } = await chrome.storage.local.get([
    'kmwEnabled',
    'kmwActiveTabId'
  ]);
  if (!kmwEnabled || details.tabId !== kmwActiveTabId || details.frameId !== 0) return;
  await chrome.scripting.executeScript({
    target: { tabId: details.tabId },
    files: ['content/content.js']
  });
  await chrome.tabs.sendMessage(details.tabId, { type: 'resume-monitoring' }).catch(() => undefined);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') {
    return false;
  }

  if (message.type === 'log-events') {
    const entries = Array.isArray(message.entries) ? message.entries.slice(0, 40) : [];
    if (!sender.tab?.id || !entries.length) {
      sendResponse({ ok: false, error: 'No activity events were provided.' });
      return false;
    }

    const sanitizedEntries = entries.map((entry) => ({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ts: entry.ts || new Date().toISOString(),
      type: typeof entry.type === 'string' ? entry.type.slice(0, 32) : 'activity',
      message: typeof entry.message === 'string' ? entry.message.slice(0, 120) : 'Activity',
      details: entry.details && typeof entry.details === 'object' ? entry.details : {},
      url: sanitizeUrl(sender.tab.url || 'about:blank')
    }));
    queueLogEntries(sanitizedEntries);
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'set-monitoring') {
    const enabled = Boolean(message.enabled);
    setAnalysisForTab(sender.tab?.id, enabled)
      .then(() => sendResponse({ ok: true, enabled }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'set-paused') {
    const enabled = Boolean(message.paused);
    const tabId = sender.tab?.id;
    chrome.storage.local.get(['kmwActiveTabId', 'kmwEnabled']).then(({ kmwActiveTabId, kmwEnabled }) => {
      if (!kmwEnabled || kmwActiveTabId !== tabId) {
        sendResponse({ ok: false, error: 'Monitoring is not active for this tab.' });
        return;
      }
      chrome.storage.local.set({ kmwPaused: enabled }).then(() => {
        sendResponse({ ok: true, paused: enabled });
      }).catch((error) => sendResponse({ ok: false, error: error.message }));
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'list-extensions') {
    chrome.management.getAll((items) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({
        ok: true,
        extensions: items.filter((item) => item.id !== chrome.runtime.id).map((item) => ({
          id: item.id,
          name: item.name,
          version: item.version,
          description: item.description || '',
          permissions: item.permissions || [],
          enabled: item.enabled,
          installType: item.installType,
          mayDisable: item.mayDisable,
          type: item.type
        }))
      });
    });
    return true;
  }

  if (message.type === 'toggle-extension') {
    if (typeof message.id !== 'string' || message.id === chrome.runtime.id) {
      sendResponse({ ok: false, error: 'That extension cannot be changed.' });
      return false;
    }
    chrome.management.setEnabled(message.id, Boolean(message.enabled), () => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === 'run-page-code') {
    const code = typeof message.code === 'string' ? message.code : '';
    const tabId = sender.tab?.id;
    if (!code.trim() || code.length > 20000 || !Number.isInteger(tabId)) {
      sendResponse({ ok: false, error: 'Provide code under 20,000 characters on a regular website tab.' });
      return false;
    }
    chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: async (source) => {
        const started = performance.now();
        try {
          const result = await new Function(`return (async () => { ${source}\n })();`)();
          let output;
          try {
            output = JSON.stringify(result);
          } catch {
            output = String(result);
          }
          return { ok: true, result: output === undefined ? String(result) : output, durationMs: Math.round(performance.now() - started) };
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : String(error), durationMs: Math.round(performance.now() - started) };
        }
      },
      args: [code]
    }).then(([injection]) => {
      const result = injection.result || { ok: false, error: 'The page returned no execution result.' };
      queueLogEntries([{
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ts: new Date().toISOString(),
        type: result.ok ? 'javascript' : 'error',
        message: result.ok ? 'User script executed' : 'User script failed',
        details: { durationMs: result.durationMs, error: result.ok ? '' : result.error },
        url: sanitizeUrl(sender.tab.url || 'about:blank')
      }]);
      sendResponse(result);
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'download-text') {
    if (typeof message.text !== 'string' || message.text.length > 5_000_000) {
      sendResponse({ ok: false, error: 'The export is too large or invalid.' });
      return false;
    }
    const filename = typeof message.filename === 'string'
      ? message.filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 120)
      : 'kmoon-export.txt';
    const mimeType = typeof message.mimeType === 'string' ? message.mimeType.slice(0, 80) : 'text/plain';
    chrome.downloads.download({
      url: `data:${mimeType};charset=utf-8,${encodeURIComponent(message.text)}`,
      filename: `KMoon Web Analyzer/${filename}`,
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ ok: true, downloadId });
    });
    return true;
  }

  if (message.type === 'capture-current-page') {
    const tabId = sender.tab?.id;
    if (!Number.isInteger(tabId)) {
      sendResponse({ ok: false, error: 'Open a regular webpage to capture it.' });
      return false;
    }
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const clone = document.documentElement.cloneNode(true);
        clone.querySelectorAll('input,textarea,select,[contenteditable="true"]').forEach((node) => {
          node.removeAttribute('value');
          node.removeAttribute('checked');
          if (node.tagName === 'TEXTAREA') node.textContent = '';
          if (node.tagName === 'SELECT') {
            node.querySelectorAll('option').forEach((option) => option.removeAttribute('selected'));
          }
          if (node.isContentEditable) node.textContent = '';
        });
        return { title: document.title, url: location.href, html: `<!doctype html>\n${clone.outerHTML}` };
      }
    }).then(async ([injection]) => {
      const snapshot = injection.result;
      if (!snapshot?.html || snapshot.html.length > 5_000_000) {
        sendResponse({ ok: false, error: 'Page snapshot is empty or exceeds the 5 MB single-page limit.' });
        return;
      }
      const fileName = `${(snapshot.title || 'website').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 80)}.html`;
      const url = `data:text/html;charset=utf-8,${encodeURIComponent(snapshot.html)}`;
      const downloadId = await chrome.downloads.download({
        url,
        filename: `KMoon Web Analyzer/${fileName}`,
        saveAs: true
      });
      sendResponse({ ok: true, downloadId, title: snapshot.title, url: sanitizeUrl(snapshot.url), bytes: new Blob([snapshot.html]).size });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'inspect-page-storage') {
    const tabId = sender.tab?.id;
    chrome.scripting.executeScript({
      target: { tabId },
      func: async () => {
        const sensitive = /(pass|token|auth|session|cookie|secret|credential|card|key)/i;
        const local = [];
        const session = [];
        const readStorage = (storage, target) => {
          try {
            for (let i = 0; i < storage.length; i += 1) {
              const key = storage.key(i);
              const value = storage.getItem(key) || '';
              target.push({
                key,
                length: value.length,
                preview: sensitive.test(key) ? '[MASKED]' : value.slice(0, 100)
              });
            }
          } catch {
            target.push({ key: '(inaccessible)', length: 0, preview: '[Storage access was denied]' });
          }
        };
        readStorage(localStorage, local);
        readStorage(sessionStorage, session);
        let databases = [];
        if (indexedDB.databases) {
          try {
            databases = (await indexedDB.databases()).map(({ name, version }) => ({ name, version }));
          } catch {
            databases = [{ name: '(inaccessible)', version: 0 }];
          }
        }
        let caches = [];
        if (window.caches) {
          try { caches = await window.caches.keys(); } catch { caches = ['(inaccessible)']; }
        }
        return { origin: location.origin, local, session, databases, caches };
      }
    }).then(([injection]) => sendResponse({ ok: true, ...injection.result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'save-session') {
    chrome.storage.local.get(['kmwHistory']).then(({ kmwHistory = [] }) => {
      const nextHistory = [message.session, ...kmwHistory].slice(0, 100);
      chrome.storage.local.set({ kmwHistory: nextHistory });
    }).catch(() => undefined);
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'verify-metadata') {
    sendResponse(getVerificationState());
    return true;
  }

  return false;
});

chrome.commands?.onCommand.addListener((command) => {
  if (command === 'toggle-analysis') {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => injectWidget(tab?.id))
      .catch((error) => console.error('Could not open the analyzer:', error));
  }
});
