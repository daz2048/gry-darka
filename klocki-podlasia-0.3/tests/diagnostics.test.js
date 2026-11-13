import test from 'node:test';
import assert from 'node:assert/strict';
import { formatServerDiagnostics, readSaveStorageStatus, relativeAge } from '../diagnostics.js';
import { setLanguage } from '../i18n.js?v=8';

const now = Date.parse('2026-11-13T10:00:00Z');
const snapshot = () => ({
  git: {
    branch: 'Minecraft-0.3-release-gates',
    clean: true,
    commit: '6458a86' + '0'.repeat(33),
    committedAt: '2026-11-13T09:30:00Z'
  },
  gitError: null,
  server: { startedAt: now - 3600000, requests: 42, httpErrors: 0, serverErrors: 0, lastError: null }
});

test('diagnostics show branch, clean/modified state, full hash, and relative commit age', () => {
  setLanguage('en', { persist: false });
  const data = snapshot();
  const clean = formatServerDiagnostics(data, now);
  assert.match(clean, /Branch: Minecraft-0\.3-release-gates · working tree: clean/);
  assert.ok(clean.includes(data.git.commit));
  assert.match(clean, /Commit age: 30 minutes ago/);
  assert.match(clean, /no server errors observed/);
  data.git.clean = false;
  assert.match(formatServerDiagnostics(data, now), /modified \(uncommitted changes\)/);
});

test('HTTP errors, server exceptions, and missing Git metadata do not report healthy', () => {
  const data = snapshot();
  data.server.httpErrors = 1;
  data.server.serverErrors = 2;
  data.server.lastError = 'HTTP 404';
  const text = formatServerDiagnostics(data, now);
  assert.match(text, /attention required/);
  assert.match(text, /1 HTTP errors · 2 server exceptions/);
  assert.match(text, /Last server error: HTTP 404/);
  data.git = null;
  data.gitError = 'not a git repository';
  data.server.httpErrors = data.server.serverErrors = 0;
  assert.match(formatServerDiagnostics(data, now), /Git metadata unavailable: not a git repository/);
  assert.doesNotMatch(formatServerDiagnostics(data, now), /no server errors observed/);
});

test('malformed server responses cannot become a healthy status', () => {
  for (const data of [{}, { ...snapshot(), server: {} }, { ...snapshot(), git: null }]) {
    assert.throws(() => formatServerDiagnostics(data, now), /Invalid game server diagnostics response/);
  }
});

test('save storage status checks persistence without requesting it', async () => {
  const store = { loadWorld: async id => ({ previousAvailable: id === 'with-backup' }) };
  for (const [id, persisted, backup, persistence] of [
    ['with-backup', true, 'available', 'persistent'],
    ['without-backup', false, 'missing', 'evictable']
  ]) {
    const storage = {
      persisted: async () => persisted,
      persist: () => { throw new Error('Must not request persistence'); }
    };
    assert.deepEqual(await readSaveStorageStatus(store, id, storage), { backup, persistence });
  }
  assert.deepEqual(await readSaveStorageStatus(store, 'with-backup', {}), {
    backup: 'available', persistence: 'unavailable'
  });
});

test('failed storage checks are reported separately without hiding successful results', async () => {
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => errors.push(args);
  try {
    const store = { loadWorld: async () => { throw new Error('database read failed'); } };
    assert.deepEqual(await readSaveStorageStatus(store, 'world', { persisted: async () => true }), {
      backup: 'unavailable', persistence: 'persistent'
    });
    const goodStore = { loadWorld: async () => ({ previousAvailable: false }) };
    assert.deepEqual(await readSaveStorageStatus(goodStore, 'world', {
      persisted: async () => { throw new Error('persistence check failed'); }
    }), { backup: 'missing', persistence: 'unavailable' });
    assert.equal(errors.length, 2);
  } finally {
    console.error = originalError;
  }
});

test('relative age handles seconds, hours, days, future dates, and Polish', () => {
  assert.equal(relativeAge(now - 10000, now), '10 seconds ago');
  assert.equal(relativeAge(now - 7200000, now), '2 hours ago');
  assert.equal(relativeAge(now - 172800000, now), '2 days ago');
  assert.equal(relativeAge(now + 60000, now), 'in 1 minute');
  assert.throws(() => relativeAge('invalid', now), /Invalid diagnostics timestamp/);
  setLanguage('pl', { persist: false });
  assert.equal(relativeAge(now - 120000, now), '2 minuty temu');
  assert.match(formatServerDiagnostics(snapshot(), now), /Gałąź: Minecraft-0\.3-release-gates/);
  setLanguage('en', { persist: false });
});
