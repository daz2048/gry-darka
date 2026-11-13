import test from 'node:test';
import assert from 'node:assert/strict';
import { BIOMES, BLOCKS, STRUCTURES, World } from '../world.js';
import { DEFAULT_LANGUAGE, LANGUAGES, MESSAGES, resolveLanguage, setLanguage, t } from '../i18n.js';

test('English is the default and Polish is only chosen explicitly', () => {
  assert.equal(DEFAULT_LANGUAGE, 'en');
  assert.equal(resolveLanguage('', null), 'en');
  assert.equal(resolveLanguage('', 'pl'), 'pl');
  assert.equal(resolveLanguage('?lang=pl', 'en'), 'pl');
  assert.equal(resolveLanguage('?lang=en', 'pl'), 'en');
  assert.equal(resolveLanguage('?lang=de', 'xx'), 'en');
});

test('every language defines the same messages and placeholders', () => {
  const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  const reference = MESSAGES.en;
  for (const language of LANGUAGES) {
    const messages = MESSAGES[language];
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(reference).sort(), language);
    for (const [key, text] of Object.entries(reference)) {
      if (typeof text === 'string') assert.deepEqual(placeholders(messages[key]), placeholders(text), `${language} ${key}`);
    }
    assert.equal(messages.blocks.length, BLOCKS.length, `${language} blocks`);
    assert.equal(messages.structures.length, STRUCTURES.length, `${language} structures`);
    assert.deepEqual(Object.keys(messages.biomes).sort(), Object.keys(BIOMES).sort(), `${language} biomes`);
  }
  assert.deepEqual(MESSAGES.pl.blocks, BLOCKS.map(block => block.name));
  assert.deepEqual(MESSAGES.pl.structures, STRUCTURES.map(site => site.name));
  assert.deepEqual(MESSAGES.pl.biomes, Object.fromEntries(Object.entries(BIOMES).map(([key, biome]) => [key, biome.name])));
});

test('new-world action and confirmation use consistent localized labels', () => {
  assert.equal(MESSAGES.en['button.newWorld'], 'New world');
  assert.equal(MESSAGES.en['button.confirmReset'], 'Yes, new world');
  assert.equal(MESSAGES.en['reset.label'], 'Confirm new world');
  assert.equal(MESSAGES.pl['button.newWorld'], 'Nowy świat');
  assert.equal(MESSAGES.pl['button.confirmReset'], 'Tak, nowy świat');
  assert.equal(MESSAGES.pl['reset.label'], 'Potwierdzenie nowego świata');
});

test('play buttons separate the play action from the localized mouse mode', () => {
  assert.equal(MESSAGES.en['button.start'], 'Play');
  assert.equal(MESSAGES.en['button.dragStart'], 'Play');
  assert.equal(MESSAGES.en['button.captureHint'], '(capture mouse)');
  assert.equal(MESSAGES.en['button.dragHint'], '(without capturing)');
  assert.equal(MESSAGES.pl['button.start'], 'Graj');
  assert.equal(MESSAGES.pl['button.dragStart'], 'Graj');
  assert.equal(MESSAGES.pl['button.captureHint'], '(przechwyć mysz)');
  assert.equal(MESSAGES.pl['button.dragHint'], '(bez przechwytywania)');
});

test('world-limit message is localized and includes the configured maximum', () => {
  assert.match(MESSAGES.en['worldPicker.limitReached'], /\{count\}/);
  assert.match(MESSAGES.pl['worldPicker.limitReached'], /\{count\}/);
  assert.match(t('worldPicker.limitReached', { count: 10 }), /10/);
});

test('incognito play explains that no world or progress will be saved in both languages', () => {
  assert.equal(MESSAGES.en['worldPicker.private'], 'Incognito');
  assert.equal(MESSAGES.pl['worldPicker.private'], 'Incognito');
  assert.match(MESSAGES.en['worldPicker.privateHelp'], /No saved world is created or changed.*cannot be saved/i);
  assert.match(MESSAGES.pl['worldPicker.privateHelp'], /zapisany świat.*nie można zapisać/);
  assert.match(MESSAGES.en['session.private'], /not saved.*saved worlds are untouched/i);
  assert.match(MESSAGES.pl['session.private'], /nie są zapisywane.*pozostają bez zmian/);
  assert.match(MESSAGES.en['save.private'], /not saving/i);
  assert.match(MESSAGES.pl['save.private'], /brak zapisu/i);
});

test('game branding is localized for the launch screen', () => {
  assert.equal(MESSAGES.en['overlay.eyebrow'], 'Podlasie Blocks · The Lime Tree Crew · <b class="version-highlight">v0.5</b>');
  assert.equal(MESSAGES.pl['overlay.eyebrow'], 'KLOCKI PODLASIA · EKIPA SPOD LIPY · <b class="version-highlight">v0.5</b>');
});

test('world edit results are translatable message keys in both languages', () => {
  const world = new World(1);
  world.blocks.fill(0);
  world.water.fill(0);
  for (let z = 0; z < 256; z++) for (let x = 0; x < 256; x++) world.blocks[x + 256 * z] = 3;
  const results = [
    world.edit(1, 0, 1, 0, null),
    world.edit(2, 2, 2, 999, null),
    world.edit(2, 2, 2, 0, null),
    world.edit(4, 3, 4, 1, { x: 4.5, y: 3, z: 4.5 })
  ];
  world.edit(2, 2, 2, 1, null);
  results.push(world.edit(2, 2, 2, 1, null));
  assert.deepEqual(results, ['edit.boundary', 'edit.unknown', 'edit.empty', 'edit.player', 'edit.occupied']);
  for (const language of LANGUAGES) {
    for (const key of results) assert.equal(typeof MESSAGES[language][key], 'string', `${language} ${key}`);
  }
});

test('translation switches language and fills placeholders', () => {
  setLanguage('pl', { persist: false });
  assert.equal(t('save.saved', { time: '08:26' }), 'Zapisano 08:26');
  setLanguage('en', { persist: false });
  assert.equal(t('save.saved', { time: '08:26' }), 'Saved 08:26');
  assert.equal(t('missing.key'), 'missing.key');
});

test('pause confirmation clearly reports a successful world save in both languages', () => {
  setLanguage('en', { persist: false });
  assert.match(t('notice.pauseSaved'), /world was saved successfully/i);
  setLanguage('pl', { persist: false });
  assert.match(t('notice.pauseSaved'), /świat został bezpiecznie zapisany/i);
  setLanguage('en', { persist: false });
});

test('pause save debug details interpolate the committed world identity and timestamp', () => {
  for (const language of LANGUAGES) {
    setLanguage(language, { persist: false });
    const text = t('notice.saveDebug', {
      id: 'test-world-id', revision: 42, time: '2026-11-13 16:20:00'
    });
    assert.match(text, /test-world-id/);
    assert.match(text, /42/);
    assert.match(text, /2026-11-13 16:20:00/);
    assert.doesNotMatch(text, /\{(?:id|revision|time)\}/);
  }
  setLanguage('en', { persist: false });
});

test('save details include localized backup and persistence status instead of a disk path', () => {
  const params = {
    label: '', name: 'World', time: '08:26', location: 'IndexedDB',
    backup: 'BACKUP_STATUS', persistence: 'PERSISTENCE_STATUS', size: '1', bytes: '1024'
  };
  for (const language of LANGUAGES) {
    setLanguage(language, { persist: false });
    const details = t('details.saved', params);
    assert.match(details, /BACKUP_STATUS/);
    assert.match(details, /PERSISTENCE_STATUS/);
    assert.doesNotMatch(details, /filesystem path|ścieżka na dysku/i);
    for (const key of ['backup.available', 'backup.missing', 'backup.unavailable',
      'persistence.persistent', 'persistence.evictable', 'persistence.unavailable']) {
      assert.notEqual(t(`details.${key}`), `details.${key}`);
    }
  }
  setLanguage('en', { persist: false });
});

test('model diagnostics include render-buffer resolution in both languages', () => {
  const params = {
    revision: '180',
    size: '256 × 32 × 256',
    seed: 42,
    fps: 60,
    calls: 10,
    geometries: 20,
    resolution: '1920 × 1080',
    pixelRatio: '1.50',
    first: 500,
    samples: 60,
    median: '16.7',
    p95: '20.0',
    edits: 3,
    position: '1.0, 2.0, 3.0'
  };
  setLanguage('en', { persist: false });
  assert.match(t('metrics.text', params), /Render buffer: 1920 × 1080 px · pixel ratio: 1\.50/);
  setLanguage('pl', { persist: false });
  assert.match(t('metrics.text', params), /Bufor renderowania: 1920 × 1080 px · współczynnik pikseli: 1\.50/);
  setLanguage('en', { persist: false });
});
