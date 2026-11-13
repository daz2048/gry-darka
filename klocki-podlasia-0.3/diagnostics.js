import { locale, onLanguageChange, t } from './i18n.js?v=7';

export async function readSaveStorageStatus(store, worldId, storage = globalThis.navigator?.storage) {
  const [backup, persistence] = await Promise.allSettled([
    Promise.resolve().then(() => store.loadWorld(worldId)),
    Promise.resolve().then(() => {
      if (typeof storage?.persisted !== 'function') return null;
      return storage.persisted();
    })
  ]);
  if (backup.status === 'rejected') console.error('Cannot check the world recovery copy:', backup.reason);
  if (persistence.status === 'rejected') console.error('Cannot check storage persistence:', persistence.reason);
  return {
    backup: backup.status === 'fulfilled' && typeof backup.value?.previousAvailable === 'boolean'
      ? backup.value.previousAvailable ? 'available' : 'missing'
      : 'unavailable',
    persistence: persistence.status === 'fulfilled' && typeof persistence.value === 'boolean'
      ? persistence.value ? 'persistent' : 'evictable'
      : 'unavailable'
  };
}

export function relativeAge(timestamp, now = Date.now()) {
  const milliseconds = new Date(timestamp).getTime();
  if (!Number.isFinite(milliseconds)) throw new TypeError('Invalid diagnostics timestamp');
  const seconds = (milliseconds - now) / 1000;
  const formatter = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' });
  for (const [unit, scale] of [['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (Math.abs(seconds) >= scale) return formatter.format(Math.round(seconds / scale), unit);
  }
  return formatter.format(Math.round(seconds), 'second');
}

export function formatServerDiagnostics(data, now = Date.now()) {
  const { git, gitError, server } = data;
  if (!server || !Number.isFinite(server.startedAt) ||
      !['requests', 'httpErrors', 'serverErrors'].every(key => Number.isInteger(server[key]) && server[key] >= 0) ||
      !(server.lastError === null || typeof server.lastError === 'string') ||
      !(git === null && typeof gitError === 'string' ||
        git && typeof git.branch === 'string' && typeof git.clean === 'boolean' &&
        /^[a-f0-9]{40,64}$/.test(git.commit) && Number.isFinite(Date.parse(git.committedAt)))) {
    throw new TypeError('Invalid game server diagnostics response');
  }
  const healthy = git !== null && server.httpErrors === 0 && server.serverErrors === 0;
  const metadata = git ? t('diagnostics.git', {
    branch: git.branch,
    state: t(git.clean ? 'diagnostics.clean' : 'diagnostics.dirty'),
    hash: git.commit,
    age: relativeAge(git.committedAt, now),
    date: new Date(git.committedAt).toLocaleString(locale())
  }) : t('diagnostics.gitUnavailable', { error: gitError });
  return `${metadata}\n${t('diagnostics.server', {
    health: t(healthy ? 'diagnostics.healthy' : 'diagnostics.attention'),
    started: relativeAge(server.startedAt, now),
    requests: server.requests,
    httpErrors: server.httpErrors,
    serverErrors: server.serverErrors
  })}${server.lastError ? `\n${t('diagnostics.lastError', { error: server.lastError })}` : ''}`;
}

export function initDiagnostics() {
  const details = document.getElementById('diagnostics');
  const output = document.getElementById('server-diagnostics');
  const logs = document.getElementById('server-logs');
  const logButton = document.getElementById('show-server-logs');
  const refreshButton = document.getElementById('refresh-diagnostics');
  const loadedAt = performance.timeOrigin;
  const runtimeErrors = [];
  let runtimeErrorCount = 0;
  let status = null;
  let statusError = null;
  let checkedAt = null;
  let busy = false;
  let logText = null;
  let logError = null;
  let logsTruncated = false;

  function render() {
    output.textContent = [
      status ? formatServerDiagnostics(status) : t(statusError ? 'diagnostics.unavailable' : 'diagnostics.waiting', { error: statusError }),
      checkedAt ? t('diagnostics.checked', { age: relativeAge(checkedAt) }) : '',
      t('diagnostics.page', { age: relativeAge(loadedAt), count: runtimeErrorCount }),
      ...runtimeErrors
    ].filter(Boolean).join('\n');
    output.dataset.state = statusError || logError || runtimeErrorCount || status && (!status.git || status.server.httpErrors || status.server.serverErrors)
      ? 'error' : status ? 'healthy' : 'waiting';
    logButton.textContent = t(logs.hidden ? 'diagnostics.showLogs' : 'diagnostics.hideLogs');
    logs.textContent = logError ? t('diagnostics.logsError', { error: logError })
      : logText === null ? t('diagnostics.logsLoading')
      : `${t(logsTruncated ? 'diagnostics.logsTruncated' : 'diagnostics.logsRecent')}\n${logText || t('diagnostics.logsEmpty')}`;
    logs.dataset.state = logError ? 'error' : 'ready';
  }

  async function fetchJSON(path) {
    const response = await fetch(path, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function refresh() {
    if (busy) return;
    busy = true;
    refreshButton.disabled = true;
    try {
      const next = await fetchJSON('/__diagnostics/status');
      formatServerDiagnostics(next);
      status = next;
      statusError = null;
      checkedAt = Date.now();
    } catch (error) {
      console.warn('Game server diagnostics:', error);
      status = null;
      statusError = error.message;
      checkedAt = null;
    }
    if (!logs.hidden) {
      try {
        const next = await fetchJSON('/__diagnostics/logs');
        if (typeof next.text !== 'string' || typeof next.truncated !== 'boolean') {
          throw new TypeError('Invalid game server log response');
        }
        logText = next.text;
        logsTruncated = next.truncated;
        logError = null;
      } catch (error) {
        console.warn('Game server logs:', error);
        logError = error.message;
      }
    }
    busy = false;
    refreshButton.disabled = false;
    render();
  }

  function recordError(message) {
    runtimeErrorCount++;
    runtimeErrors.push(String(message).slice(0, 1000));
    if (runtimeErrors.length > 5) runtimeErrors.shift();
    render();
  }

  window.addEventListener('error', event => {
    recordError(event.message || `Resource failed: ${event.target?.src || event.target?.href || event.type}`);
  }, true);
  window.addEventListener('unhandledrejection', event => {
    recordError(event.reason?.message || String(event.reason));
  });
  document.getElementById('viewport').addEventListener('webglcontextlost', () => {
    recordError(t('diagnostics.contextLost'));
  }, true);
  details.addEventListener('toggle', () => { if (details.open) void refresh(); });
  refreshButton.addEventListener('click', () => { void refresh(); });
  logButton.addEventListener('click', () => {
    logs.hidden = !logs.hidden;
    logButton.setAttribute('aria-expanded', String(!logs.hidden));
    render();
    if (!logs.hidden) void refresh();
  });
  onLanguageChange(render);
  setInterval(() => {
    if (details.open && !document.hidden) void refresh();
  }, 15000);
  render();
}
